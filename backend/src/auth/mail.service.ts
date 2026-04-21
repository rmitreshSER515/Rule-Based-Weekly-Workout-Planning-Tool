import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    opts: { expiresInMinutes: number },
  ): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY')?.trim();
    const from = this.config.get<string>('MAIL_FROM')?.trim();
    const subject = 'Reset your Workout Planner password';

    const safeUrl = escapeHtml(resetUrl);
    const minutes = opts.expiresInMinutes;
    const expiryLabel =
      minutes >= 60 && minutes % 60 === 0
        ? `${minutes / 60} hour(s)`
        : `${minutes} minute(s)`;

    const html = `
      <p>Hi,</p>
      <p>We received a request to reset your password. Use the link below. It expires in <strong>${escapeHtml(expiryLabel)}</strong>.</p>
      <p><a href="${safeUrl}">Reset password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `;

    const text = [
      'We received a request to reset your Workout Planner password.',
      `Open this link to choose a new password (expires in ${expiryLabel}):`,
      resetUrl,
      '',
      'If you did not request this, ignore this email.',
    ].join('\n');

    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY not set — password reset link for ${to}: ${resetUrl}`,
      );
      return;
    }

    if (!from) {
      this.logger.warn(
        `MAIL_FROM not set — password reset link for ${to}: ${resetUrl}`,
      );
      return;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Resend failed: ${res.status} ${body}`);
      throw new ServiceUnavailableException(
        'Could not send reset email. Try again later.',
      );
    }
  }
}
