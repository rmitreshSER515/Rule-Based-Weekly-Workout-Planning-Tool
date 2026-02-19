export type ConditionType = 'exercise' | 'intensity';
export type WhenType = 'sameDay' | 'dayAfter' | 'withinDays';
export type RuleAction = 'notAllowed';

export interface Condition {
  type: ConditionType;
  value: string;
}

export interface WhenCondition {
  type: WhenType;
  value?: number;
}

export interface Violation {
  ruleId: string;
  message: string;
  affectedScheduleEntryIds: string[];
  severity: 'error';
}
