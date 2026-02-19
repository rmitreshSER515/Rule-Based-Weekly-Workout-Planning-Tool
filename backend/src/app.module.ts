import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExercisesModule } from './exercises/exercises.module';
import { RulesModule } from './rules/rules.module';
import { SchedulesModule } from './schedules/schedules.module';
import { MetricsModule } from './metrics/metrics.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ExercisesModule, RulesModule, SchedulesModule, MetricsModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
