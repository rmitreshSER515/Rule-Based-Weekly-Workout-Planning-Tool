import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationStatus,
} from './entities/notification.schema';

type CreateNotificationInput = {
  userId: string;
  fromUserId: string;
  scheduleId: string;
  message: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
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
}
