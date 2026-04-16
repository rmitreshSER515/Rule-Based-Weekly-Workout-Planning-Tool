import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
  NotificationType,
} from './entities/notification.schema';
import { SchedulesService } from '../schedules/schedules.service';
import { ExercisesService } from '../exercises/exercises.service';
import { RulesService } from '../rules/rules.service';
import { User, UserDocument } from '../users/user.schema';

type CreateNotificationInput = {
  userId: string;
  fromUserId: string;
  scheduleId?: string;
  message: string;
  type?: NotificationType;
};

/** One `(shared)` suffix; strips repeated leading/trailing markers so titles don't stack. */
function titleForSharedCopy(rawTitle: string | undefined): string {
  let t = (rawTitle ?? '').trim();
  const leading = /^\s*\(shared\)\s*/i;
  const trailing = /\s*\(shared\)\s*$/i;
  let prev = '';
  while (prev !== t) {
    prev = t;
    t = t.replace(leading, '').replace(trailing, '').trim();
  }
  const base = t || 'Untitled Schedule';
  return `${base} (shared)`;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly schedulesService: SchedulesService,
    private readonly exercisesService: ExercisesService,
    private readonly rulesService: RulesService,
  ) {}

  async create(input: CreateNotificationInput) {
    const type = input.type ?? 'schedule_share';

    if (!input.userId || !input.fromUserId) {
      throw new BadRequestException('Both users are required');
    }

    if (input.userId === input.fromUserId) {
      throw new BadRequestException(
        type === 'friend_request'
          ? 'You cannot add yourself as a friend'
          : 'You cannot share a schedule with yourself',
      );
    }

    if (type === 'schedule_share') {
      if (!input.scheduleId) {
        throw new BadRequestException('Schedule id is required for sharing');
      }

      const sender = await this.userModel.findById(input.fromUserId).exec();
      if (!sender) {
        throw new NotFoundException('Sender not found');
      }

      if (!(sender.friendIds ?? []).includes(input.userId)) {
        throw new ForbiddenException(
          'You can only share schedules with accepted friends',
        );
      }

      const schedule = await this.schedulesService.findById(input.scheduleId);
      if (!schedule) {
        throw new NotFoundException('Schedule not found');
      }

      if (schedule.userId !== input.fromUserId) {
        throw new ForbiddenException('You can only share your own schedules');
      }

      const existingPending = await this.notificationModel
        .findOne({
          type: 'schedule_share',
          status: 'pending',
          userId: input.userId,
          fromUserId: input.fromUserId,
          scheduleId: input.scheduleId,
        })
        .exec();

      if (existingPending) {
        return existingPending;
      }
    }

    const doc = new this.notificationModel({
      userId: input.userId,
      fromUserId: input.fromUserId,
      scheduleId: input.scheduleId,
      message: input.message,
      status: 'pending',
      type,
    });
    return doc.save();
  }

  async findByUserId(userId: string, status?: NotificationStatus) {
    const filter: Record<string, string> = { userId };
    if (status) filter.status = status;

    return this.notificationModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async updateStatus(
    id: string,
    userId: string,
    status: NotificationStatus,
  ) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Notification not found');
    }
    const existing = await this.notificationModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Notification not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('Cannot update another user notification');
    }

    if (status === 'accepted') {
      if (existing.type === 'friend_request') {
        return this.acceptFriendRequest(id, userId);
      }
      if (existing.type === 'schedule_share') {
        return this.acceptScheduleShare(id, userId);
      }
    }

    existing.set({ status });
    return existing.save();
  }

  async acceptFriendRequest(id: string, userId: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Notification not found');
    }

    const existing = await this.notificationModel.findById(id).exec();
    if (!existing || existing.type !== 'friend_request') {
      throw new NotFoundException('Notification not found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('Cannot update another user notification');
    }

    if (existing.status === 'accepted') {
      return existing;
    }

    const recipient = await this.userModel.findById(userId).exec();
    const sender = await this.userModel.findById(existing.fromUserId).exec();

    if (!recipient || !sender) {
      throw new NotFoundException('User not found');
    }

    await this.userModel
      .updateOne(
        { _id: recipient._id },
        { $addToSet: { friendIds: sender._id.toString() } },
      )
      .exec();

    await this.userModel
      .updateOne(
        { _id: sender._id },
        { $addToSet: { friendIds: recipient._id.toString() } },
      )
      .exec();

    existing.set({ status: 'accepted' });
    return existing.save();
  }

  async acceptScheduleShare(id: string, userId: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Notification not found');
    }
    const existing = await this.notificationModel.findById(id).exec();
    if (!existing || existing.type !== 'schedule_share') {
      throw new NotFoundException('Notification not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('Cannot update another user notification');
    }
    if (existing.status === 'accepted') {
      return existing;
    }

    if (!existing.scheduleId) {
      throw new BadRequestException('Schedule id is missing for this share');
    }

    const schedule = await this.schedulesService.findById(existing.scheduleId);
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const calendarExercises = schedule.calendarExercises ?? {};
    const exerciseNames = Object.values(calendarExercises).flatMap((items) =>
      items.map((item) => item.name).filter(Boolean),
    );
    const ensured = await this.exercisesService.ensureExercisesForUser(
      userId,
      exerciseNames,
    );
    const nameToId = new Map(
      ensured.map((ex) => [ex.name.trim().toLowerCase(), ex._id.toString()]),
    );

    const remappedCalendar: typeof calendarExercises = {};
    for (const [dateKey, items] of Object.entries(calendarExercises)) {
      remappedCalendar[dateKey] = items.map((item) => ({
        ...item,
        exerciseId: nameToId.get(item.name.trim().toLowerCase()) ?? '',
      }));
    }

    const sourceRuleIds = schedule.selectedRuleIds ?? [];
    const sourceRules = await this.rulesService.findByIds(sourceRuleIds);
    const importedRules = await this.rulesService.ensureRulesForUser(
      userId,
      sourceRules,
    );
    const newRuleIds = importedRules.map((r) => r._id.toString());

    await this.schedulesService.create({
      userId,
      title: titleForSharedCopy(schedule.title),
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      selectedRuleIds: newRuleIds,
      calendarExercises: remappedCalendar,
    });

    existing.set({ status: 'accepted' });
    return existing.save();
  }
}
