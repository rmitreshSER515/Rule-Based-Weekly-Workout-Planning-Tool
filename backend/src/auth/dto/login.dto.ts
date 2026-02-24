import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/, { message: 'Password must include 1 uppercase' })
  @Matches(/\d/, { message: 'Password must include 1 digit' })
  @Matches(/[^A-Za-z0-9]/, { message: 'Password must include 1 symbol' })
  password: string;
}