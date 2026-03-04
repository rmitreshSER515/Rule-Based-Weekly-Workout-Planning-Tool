import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { Condition, WhenCondition, RuleAction } from '../types/rule.types';

export type RuleDocument = HydratedDocument<Rule>;

@Schema({ timestamps: true })
export class Rule {
  @Prop({ required: true })
  userId: string;

  // Optional schedule association for future use
  @Prop()
  scheduleId?: string;

  // Human-readable metadata matching the UI
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  ifExercise: string;

  @Prop({ required: true, trim: true })
  ifActivityType: string;

  @Prop({ required: true, trim: true })
  ifTiming: string;

  @Prop({ required: true, trim: true })
  thenExercise: string;

  @Prop({ required: true, trim: true })
  thenActivityType: string;

  @Prop({ required: true, trim: true })
  thenRestriction: string;

  @Prop({ type: Object, required: true })
  ifCondition: Condition;

  @Prop({ type: Object, required: true })
  whenCondition: WhenCondition;

  @Prop({ type: Object, required: true })
  thenCondition: Condition;

  @Prop({ default: 'notAllowed' })
  action: RuleAction;

  @Prop({ default: true })
  isActive: boolean;
}

export const RuleSchema = SchemaFactory.createForClass(Rule);