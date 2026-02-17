import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { Condition, WhenCondition, RuleAction } from '../types/rule.types.js';

@Entity()
export class Rule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  scheduleId: string;

  @Column({ type: 'json' })
  ifCondition: Condition;

  @Column({ type: 'json' })
  whenCondition: WhenCondition;

  @Column({ type: 'json' })
  thenCondition: Condition;

  @Column({ default: 'notAllowed' })
  action: RuleAction;

  @Column({ default: true })
  isActive: boolean;
}
