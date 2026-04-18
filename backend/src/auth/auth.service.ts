import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import {
  PasswordResetToken,
  PasswordResetTokenDocument,
} from './schemas/password-reset-token.schema';
import { MailService } from './mail.service';
import {
  generateRawResetToken,
  hashResetToken,
  isValidResetTokenFormat,
} from './password-reset.utils';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function passwordRuleOk(v: string) {
  const hasUpper = /[A-Z]/.test(v);
  const hasDigit = /\d/.test(v);
  const hasSymbol = /[^A-Za-z0-9]/.test(v);
  return hasUpper && hasDigit && hasSymbol;
}

const GENERIC_FORGOT_RESPONSE = {
  message:
    'If an account exists for that email, you will receive reset instructions shortly.',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    @InjectModel(PasswordResetToken.name)
    private readonly resetTokenModel: Model<PasswordResetTokenDocument>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
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

  private getResetTtlMs(): number {
    const raw = this.config.get<string>('PASSWORD_RESET_TTL_MS');
    const n = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n > 0) return n;
    return 60 * 60 * 1000;
  }

  private getFrontendBaseUrl(): string {
    const base = this.config.get<string>('FRONTEND_URL')?.trim();
    const nodeEnv =
      this.config.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';

    if (!base) {
      if (nodeEnv === 'production') {
        throw new InternalServerErrorException(
          'Password reset is not configured (set FRONTEND_URL).',
        );
      }
      return 'http://localhost:5173';
    }

    const cleaned = base.replace(/\/+$/, '');
    if (/^javascript:/i.test(cleaned)) {
      throw new InternalServerErrorException('Invalid FRONTEND_URL configuration.');
    }

    if (nodeEnv === 'production' && !/^https:\/\//i.test(cleaned)) {
      throw new InternalServerErrorException(
        'FRONTEND_URL must use https in production.',
      );
    }

    try {
      void new URL(cleaned);
    } catch {
      throw new InternalServerErrorException('Invalid FRONTEND_URL configuration.');
    }

    return cleaned;
  }

  /** Same response whether or not the email exists (avoid account enumeration). */
  async requestPasswordReset(email: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestException('Invalid email');
    }

    const frontendBase = this.getFrontendBaseUrl();

    await new Promise((r) => setTimeout(r, 100 + Math.floor(Math.random() * 100)));

    const user = await this.users.findByEmail(normalizedEmail);
    if (!user) {
      return GENERIC_FORGOT_RESPONSE;
    }

    await this.resetTokenModel.deleteMany({ userId: user._id }).exec();

    const raw = generateRawResetToken();
    const tokenHash = hashResetToken(raw);
    const expiresAt = new Date(Date.now() + this.getResetTtlMs());

    await this.resetTokenModel.create({
      tokenHash,
      userId: user._id,
      expiresAt,
    });

    const resetUrl = `${frontendBase}/reset-password?token=${encodeURIComponent(raw)}`;
    const expiresInMinutes = Math.max(1, Math.ceil(this.getResetTtlMs() / 60000));

    try {
      await this.mail.sendPasswordResetEmail(normalizedEmail, resetUrl, {
        expiresInMinutes,
      });
    } catch {
      await this.resetTokenModel.deleteOne({ tokenHash }).exec();
      throw new BadRequestException(
        'Could not send reset email. Try again later.',
      );
    }

    return GENERIC_FORGOT_RESPONSE;
  }

  async resetPassword(token: string, newPassword: string) {
    const trimmed = token.trim();
    if (!isValidResetTokenFormat(trimmed)) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    if (!passwordRuleOk(newPassword || '')) {
      throw new BadRequestException(
        'Password must include 1 uppercase, 1 digit, and 1 symbol',
      );
    }

    const tokenHash = hashResetToken(trimmed);
    const record = await this.resetTokenModel
      .findOne({
        tokenHash,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!record) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.users.setPasswordHashByUserId(
      record.userId.toString(),
      passwordHash,
    );
    await this.resetTokenModel.deleteMany({ userId: record.userId }).exec();

    return { ok: true, message: 'Password updated. You can sign in now.' };
  }
}