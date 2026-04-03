import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RESEND_API_URL = 'https://api.resend.com/emails';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Sends a password reset email via Resend (https://resend.com).
   * Requires RESEND_API_KEY. MAIL_FROM should match a verified sender/domain in Resend.
   */
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }

    const from =
      this.config.get<string>('MAIL_FROM') ??
      'Workout Planner <onboarding@resend.dev>';

    const subject = 'Reset your password';
    const html = `
      <p>You requested a password reset.</p>
      <p><a href="${resetLink}">Click here to set a new password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>This link expires in one hour.</p>
    `;

    const res = await fetch(RESEND_API_URL, {
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
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      this.logger.error(
        `Resend error ${res.status}: ${JSON.stringify(body)}`,
      );
      throw new Error(
        typeof body === 'object' && body && 'message' in body
          ? String((body as { message?: unknown }).message)
          : 'Failed to send email',
      );
    }
  }
}
