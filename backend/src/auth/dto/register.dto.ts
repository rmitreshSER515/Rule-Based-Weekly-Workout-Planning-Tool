import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Match } from './validators/match.decorator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Password must include 1 uppercase letter' })
  @Matches(/\d/, { message: 'Password must include 1 digit' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Password must include 1 symbol' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Match('password', { message: 'Confirm password must match password' })
  confirmPassword: string;
}