import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export type NotificationStatus = 'pending' | 'accepted' | 'declined';
export type NotificationType = 'schedule_share' | 'friend_request';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  fromUserId: string;

  @Prop()
  scheduleId?: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, default: 'pending' })
  status: NotificationStatus;

  @Prop({ required: true, default: 'schedule_share' })
  type: NotificationType;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
