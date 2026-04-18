import { IsNotEmpty, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

/** Raw token from URL (64 hex chars from 32 random bytes). */
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @Length(64, 64)
  @Matches(/^[a-f0-9]+$/i, { message: 'Invalid reset token' })
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
