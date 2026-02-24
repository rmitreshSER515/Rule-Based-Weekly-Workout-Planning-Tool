import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import type { Condition, WhenCondition, RuleAction } from '../types/rule.types';

export type RuleDocument = HydratedDocument<Rule>;

@Schema({ timestamps: true })
export class Rule {
  @Prop({ required: true })
  scheduleId: string;

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