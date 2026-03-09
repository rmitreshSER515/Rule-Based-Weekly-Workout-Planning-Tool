import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

const TIMINGS = ['the day before', 'the day after', 'the same day'] as const;
type TimingValue = (typeof TIMINGS)[number];

const RESTRICTIONS = ['not allowed', 'allowed'] as const;
type RestrictionValue = (typeof RESTRICTIONS)[number];

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  ifExercise: string;

  @IsString()
  @IsNotEmpty()
  ifActivityType: string;

  @IsString()
  @IsIn(TIMINGS)
  ifTiming: TimingValue;

  @IsString()
  @IsNotEmpty()
  thenExercise: string;

  @IsString()
  @IsNotEmpty()
  thenActivityType: string;

  @IsString()
  @IsIn(RESTRICTIONS)
  thenRestriction: RestrictionValue;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

