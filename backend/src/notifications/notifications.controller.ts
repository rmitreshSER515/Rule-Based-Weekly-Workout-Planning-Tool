import { Body, Controller, Get, Patch, Post, Query, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import type {
  NotificationStatus,
  NotificationType,
} from './entities/notification.schema';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @Query('userId') userId?: string,
    @Query('status') status?: NotificationStatus,
  ) {
    if (!userId) return [];
    const items = await this.notificationsService.findByUserId(userId, status);
    return items.map((item) => ({
      id: item._id.toString(),
      userId: item.userId,
      fromUserId: item.fromUserId,
      scheduleId: item.scheduleId,
      message: item.message,
      status: item.status,
      type: item.type,
      createdAt: item.get('createdAt'),
      updatedAt: item.get('updatedAt'),
    }));
  }

  @Post()
  async create(
    @Body()
    body: {
      userId: string;
      fromUserId: string;
      scheduleId?: string;
      message: string;
      type?: NotificationType;
    },
  ) {
    const created = await this.notificationsService.create(body);
    return {
      id: created._id.toString(),
      userId: created.userId,
      fromUserId: created.fromUserId,
      scheduleId: created.scheduleId,
      message: created.message,
      status: created.status,
      type: created.type,
      createdAt: created.get('createdAt'),
      updatedAt: created.get('updatedAt'),
    };
  }

  @Patch(':id')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { userId: string; status: NotificationStatus },
  ) {
    const updated = await this.notificationsService.updateStatus(
      id,
      body.userId,
      body.status,
    );
    return {
      id: updated._id.toString(),
      userId: updated.userId,
      fromUserId: updated.fromUserId,
      scheduleId: updated.scheduleId,
      message: updated.message,
      status: updated.status,
      type: updated.type,
      createdAt: updated.get('createdAt'),
      updatedAt: updated.get('updatedAt'),
    };
  }
}
