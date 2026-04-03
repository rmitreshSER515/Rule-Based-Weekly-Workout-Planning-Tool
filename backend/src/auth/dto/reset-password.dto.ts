import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Password must include 1 uppercase letter' })
  @Matches(/\d/, { message: 'Password must include 1 digit' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Password must include 1 symbol' })
  newPassword: string;
}
