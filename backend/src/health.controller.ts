import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly conn: Connection) {}

  @Get('db')
  async db() {
    const db = this.conn.db;
    if (!db) return { ok: false, db: 'down' };

    await db.admin().ping();
    return { ok: true, db: 'up' };
  }
}