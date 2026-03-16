import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SaveScheduleDto } from './dto/save-schedule.dto';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async save(@Body() dto: SaveScheduleDto) {
    const schedule = await this.schedulesService.upsert(dto);
    return {
      id: schedule._id.toString(),
      userId: schedule.userId,
      title: schedule.title,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      selectedRuleIds: schedule.selectedRuleIds,
      calendarExercises: schedule.calendarExercises,
      createdAt: schedule.get('createdAt'),
      updatedAt: schedule.get('updatedAt'),
    };
  }

  @Get()
  async findForUser(@Query('userId') userId: string) {
    if (!userId) {
      return null;
    }
    const schedule = await this.schedulesService.findByUserId(userId);
    if (!schedule) {
      return null;
    }
    return {
      id: schedule._id.toString(),
      userId: schedule.userId,
      title: schedule.title,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      selectedRuleIds: schedule.selectedRuleIds,
      calendarExercises: schedule.calendarExercises,
      createdAt: schedule.get('createdAt'),
      updatedAt: schedule.get('updatedAt'),
    };
  }
}
