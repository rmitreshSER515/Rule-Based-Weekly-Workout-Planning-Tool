import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ExercisesModule } from './exercises/exercises.module';
import { RulesModule } from './rules/rules.module';
import { SchedulesModule } from './schedules/schedules.module';
import { MetricsModule } from './metrics/metrics.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { NotificationsModule } from './notifications/notifications.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),

    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/workout_planner',
      { serverSelectionTimeoutMS: 5000 },
    ),

    ExercisesModule,
    RulesModule,
    SchedulesModule,
    MetricsModule,
    UsersModule,
    AuthModule,
    NotificationsModule,

    
  ],
  // controllers: [AppController, HealthController],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
