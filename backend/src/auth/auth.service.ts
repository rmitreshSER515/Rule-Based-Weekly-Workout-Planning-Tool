import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import {
  PASSWORD_RESET_COOLDOWN_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from './password-reset.constants';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordRuleOk(v: string) {
  const hasUpper = /[A-Z]/.test(v);
  const hasDigit = /\d/.test(v);
  const hasSymbol = /[^A-Za-z0-9]/.test(v);
  return hasUpper && hasDigit && hasSymbol;
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
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

  /**
   * Issue a password reset token (email sending is handled separately).
   * Always returns { ok: true } when the email is invalid or user missing (no enumeration).
   * Throws 429 if the same account requested a reset within the cooldown window.
   */
  async requestPasswordReset(email: string): Promise<{ ok: true }> {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestException('Invalid email');
    }

    const user = await this.users.findDocumentByEmail(normalizedEmail);
    if (!user) {
      return { ok: true };
    }

    const last = user.passwordResetRequestedAt;
    if (
      last &&
      Date.now() - new Date(last).getTime() < PASSWORD_RESET_COOLDOWN_MS
    ) {
      throw new HttpException(
        'Please wait before requesting another reset link.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const now = new Date();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

    await this.users.setPasswordResetFields(normalizedEmail, {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
      passwordResetRequestedAt: now,
    });

    if (process.env.NODE_ENV !== 'production') {
      const base =
        process.env.FRONTEND_URL?.replace(/\/$/, '') ?? 'http://localhost:5173';
      const link = `${base}/reset-password?email=${encodeURIComponent(normalizedEmail)}&token=${rawToken}`;
      console.log(
        `[password-reset] Dev only — reset link for ${normalizedEmail}:\n${link}`,
      );
    }

    return { ok: true };
  }

  async resetPassword(
    email: string,
    token: string,
    newPassword: string,
  ): Promise<{ ok: true }> {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestException('Invalid email');
    }
    if (!passwordRuleOk(newPassword || '')) {
      throw new BadRequestException(
        'Password must include 1 uppercase, 1 digit, and 1 symbol',
      );
    }

    const raw = (token || '').trim();
    if (!raw) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.users.findDocumentByEmail(normalizedEmail);
    if (
      !user?.passwordResetTokenHash ||
      !user.passwordResetExpiresAt
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const presentedHash = hashResetToken(raw);
    if (!timingSafeEqualHex(presentedHash, user.passwordResetTokenHash)) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await this.users.setPasswordAndClearReset(
      normalizedEmail,
      passwordHash,
    );
    if (!updated) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return { ok: true };
  }
}