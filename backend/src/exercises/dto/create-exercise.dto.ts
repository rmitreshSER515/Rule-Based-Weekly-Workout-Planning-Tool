import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

