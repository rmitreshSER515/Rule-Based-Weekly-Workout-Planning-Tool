import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordRuleOk(v: string) {
  const hasUpper = /[A-Z]/.test(v);
  const hasDigit = /\d/.test(v);
  const hasSymbol = /[^A-Za-z0-9]/.test(v);
  return hasUpper && hasDigit && hasSymbol;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
  ) {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestException('Invalid email');
    }
    if (!passwordRuleOk(password || '')) {
      throw new BadRequestException('Password must include 1 uppercase, 1 digit, and 1 symbol');
    }

    const created = await this.users.createUser({
      email: normalizedEmail,
      password,
      firstName,
      lastName,
      phoneNumber,
    });

    if (!created) {
      throw new BadRequestException('User already exists');
    }

    const accessToken = await this.jwt.signAsync({
      sub: created.id,
      email: created.email,
      role: created.role,
    });

    return { ok: true, accessToken, user: created };
  }

  async login(email: string, password: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestException('Invalid email');
    }
    if (!passwordRuleOk(password || '')) {
      throw new BadRequestException('Password must include 1 uppercase, 1 digit, and 1 symbol');
    }

    const user = await this.users.validateUser(normalizedEmail, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { ok: true, accessToken, user };
  }
}