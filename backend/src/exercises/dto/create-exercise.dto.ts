import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const EXERCISE_NAME_REGEX = /^[a-zA-Z0-9\s\-']+$/;

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(25)
  @Matches(EXERCISE_NAME_REGEX, {
    message: 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes',
  })
  name: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

