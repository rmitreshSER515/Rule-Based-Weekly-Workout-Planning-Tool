import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Rule, RuleDocument } from './entities/rule.schema';
import type { CreateRuleDto } from './dto/create-rule.dto';
import type { Condition, WhenCondition } from './types/rule.types';

@Injectable()
export class RulesService {
  constructor(
    @InjectModel(Rule.name)
    private readonly ruleModel: Model<RuleDocument>,
  ) {}

  async create(dto: CreateRuleDto): Promise<RuleDocument> {
    const whenCondition: WhenCondition =
      dto.ifTiming === 'the same day'
        ? { type: 'sameDay' }
        : dto.ifTiming === 'the day after'
        ? { type: 'dayAfter', value: 1 }
        : { type: 'withinDays', value: 1 };

    const ifCondition: Condition = {
      type: 'exercise',
      value: dto.ifActivityType,
    };

    const thenCondition: Condition = {
      type: 'exercise',
      value: dto.thenActivityType,
    };

    const doc = new this.ruleModel({
      userId: dto.userId,
      name: dto.name.trim(),
      ifExercise: dto.ifExercise,
      ifActivityType: dto.ifActivityType,
      ifTiming: dto.ifTiming,
      thenExercise: dto.thenExercise,
      thenActivityType: dto.thenActivityType,
      thenRestriction: dto.thenRestriction,
      ifCondition,
      whenCondition,
      thenCondition,
      action: dto.thenRestriction === 'not allowed' ? 'notAllowed' : 'notAllowed',
      isActive: dto.isActive ?? true,
    });

    return doc.save();
  }

  async findByUserId(userId: string): Promise<RuleDocument[]> {
    return this.ruleModel
      .find({ userId })
      .sort({ createdAt: 1 })
      .exec();
  }
}

