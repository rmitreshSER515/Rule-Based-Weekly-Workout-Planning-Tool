import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ScheduleDocument = HydratedDocument<Schedule>;

@Schema({ timestamps: true })
export class Schedule {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  startDate: string;

  @Prop({ required: true })
  endDate: string;

  @Prop({ type: [String], default: [] })
  selectedRuleIds: string[];

  @Prop({ type: Object, default: {} })
  calendarExercises: Record<
    string,
    {
      id: string;
      exerciseId: string;
      name: string;
      notes: string;
      intensity: 'low' | 'moderate' | 'high';
      duration: { hours: string; minutes: string };
    }[]
  >;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
