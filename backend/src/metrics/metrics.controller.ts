import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { SchedulesService } from '../schedules/schedules.service';

@Controller('metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly schedulesService: SchedulesService,
  ) {}

  @Get('schedules/:id')
  async getScheduleMetrics(@Param('id') id: string) {
    const schedule = await this.schedulesService.findById(id);
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    const metrics = this.metricsService.computeScheduleMetrics(
      schedule.calendarExercises ?? {},
    );

    return {
      scheduleId: schedule._id.toString(),
      metrics,
    };
  }
}
