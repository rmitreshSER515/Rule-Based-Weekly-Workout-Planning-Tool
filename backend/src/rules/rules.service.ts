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
    const derived = this.buildDerivedFields(dto);

    const doc = new this.ruleModel({
      userId: dto.userId,
      name: dto.name.trim(),
      ifExercise: dto.ifExercise,
      ifActivityType: dto.ifActivityType,
      ifTiming: dto.ifTiming,
      thenExercise: dto.thenExercise,
      thenActivityType: dto.thenActivityType,
      thenRestriction: dto.thenRestriction,
      ...derived,
      isActive: dto.isActive ?? true,
    });

    return doc.save();
  }

  async update(id: string, dto: CreateRuleDto): Promise<RuleDocument | null> {
    const derived = this.buildDerivedFields(dto);

    return this.ruleModel
      .findOneAndUpdate(
        { _id: id, userId: dto.userId },
        {
          $set: {
            name: dto.name.trim(),
            ifExercise: dto.ifExercise,
            ifActivityType: dto.ifActivityType,
            ifTiming: dto.ifTiming,
            thenExercise: dto.thenExercise,
            thenActivityType: dto.thenActivityType,
            thenRestriction: dto.thenRestriction,
            ...derived,
            isActive: dto.isActive ?? true,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .exec();
  }

  private buildDerivedFields(dto: CreateRuleDto): {
    ifCondition: Condition;
    whenCondition: WhenCondition;
    thenCondition: Condition;
    action: 'notAllowed';
  } {
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

    return {
      ifCondition,
      whenCondition,
      thenCondition,
      action: dto.thenRestriction === 'not allowed' ? 'notAllowed' : 'notAllowed',
    };
  }

  async findByUserId(userId: string): Promise<RuleDocument[]> {
    return this.ruleModel
      .find({ userId })
      .sort({ createdAt: 1 })
      .exec();
  }

  async findByIds(ids: string[]): Promise<RuleDocument[]> {
    if (ids.length === 0) return [];
    return this.ruleModel.find({ _id: { $in: ids } }).exec();
  }

  async ensureRulesForUser(
    userId: string,
    sourceRules: RuleDocument[],
  ): Promise<RuleDocument[]> {
    if (sourceRules.length === 0) return [];

    const existingRules = await this.findByUserId(userId);

    const matchKey = (r: { name: string; ifExercise: string; ifActivityType: string; ifTiming: string; thenExercise: string; thenActivityType: string; thenRestriction: string }) =>
      [r.name, r.ifExercise, r.ifActivityType, r.ifTiming, r.thenExercise, r.thenActivityType, r.thenRestriction]
        .map((v) => v.trim().toLowerCase())
        .join('|');

    const existingMap = new Map(
      existingRules.map((r) => [matchKey(r), r]),
    );

    const result: RuleDocument[] = [];
    for (const src of sourceRules) {
      const key = matchKey(src);
      const existing = existingMap.get(key);
      if (existing) {
        result.push(existing);
      } else {
        const doc = new this.ruleModel({
          userId,
          name: src.name,
          ifExercise: src.ifExercise,
          ifActivityType: src.ifActivityType,
          ifTiming: src.ifTiming,
          thenExercise: src.thenExercise,
          thenActivityType: src.thenActivityType,
          thenRestriction: src.thenRestriction,
          ifCondition: src.ifCondition,
          whenCondition: src.whenCondition,
          thenCondition: src.thenCondition,
          action: src.action,
          isActive: src.isActive,
        });
        const saved = await doc.save();
        existingMap.set(key, saved);
        result.push(saved);
      }
    }

    return result;
  }

  async remove(id: string, userId: string): Promise<RuleDocument | null> {
  return this.ruleModel.findOneAndDelete({ _id: id, userId }).exec();
}
}

