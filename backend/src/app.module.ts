import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ExercisesModule } from './exercises/exercises.module';
import { RulesModule } from './rules/rules.module';
import { SchedulesModule } from './schedules/schedules.module';
import { MetricsModule } from './metrics/metrics.module';
import { UsersModule } from './users/users.module';
import { join } from 'path';
import { HealthController } from './health.controller';
// If you actually have this module, keep it imported; otherwise remove it.
// import { DumpModule } from './dump/dump.module';


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
    // DumpModule, // keep only if it exists and is imported
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}