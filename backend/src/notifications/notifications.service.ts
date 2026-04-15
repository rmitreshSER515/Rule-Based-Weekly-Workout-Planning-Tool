import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
} from './entities/notification.schema';
import { SchedulesService } from '../schedules/schedules.service';
import { ExercisesService } from '../exercises/exercises.service';
import { RulesService } from '../rules/rules.service';

type CreateNotificationInput = {
  userId: string;
  fromUserId: string;
  scheduleId: string;
  message: string;
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
    private readonly schedulesService: SchedulesService,
    private readonly exercisesService: ExercisesService,
    private readonly rulesService: RulesService,
  ) {}

  async create(input: CreateNotificationInput) {
    const doc = new this.notificationModel({
      userId: input.userId,
      fromUserId: input.fromUserId,
      scheduleId: input.scheduleId,
      message: input.message,
      status: 'pending',
      type: 'schedule_share',
    });
    return doc.save();
  }

  async findByUserId(userId: string, status?: NotificationStatus) {
    const filter: Record<string, string> = { userId };
    if (status) filter.status = status;

    return this.notificationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
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
    existing.set({ status });
    return existing.save();
  }

  async acceptScheduleShare(id: string, userId: string) {
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
    if (existing.status === 'accepted') {
      return existing;
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

    // Import rules referenced by the shared schedule
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
