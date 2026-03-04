<<<<<<< feature_exercise_validation
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const EXERCISE_NAME_REGEX = /^[a-zA-Z0-9\s\-']+$/;
=======
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
>>>>>>> release_sprint_03

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
<<<<<<< feature_exercise_validation
  @MaxLength(25)
  @Matches(EXERCISE_NAME_REGEX, {
    message: 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes',
  })
=======
>>>>>>> release_sprint_03
  name: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

