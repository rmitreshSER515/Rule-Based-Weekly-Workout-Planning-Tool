import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SaveScheduleDto } from './dto/save-schedule.dto';
import type { ScheduleDocument } from './entities/schedule.schema';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: SaveScheduleDto) {
    const schedule = await this.schedulesService.create(dto);
    return this.toResponse(schedule);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: SaveScheduleDto) {
    const schedule = await this.schedulesService.update(id, dto);
    return this.toResponse(schedule);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string, @Query('userId') userId: string) {
    const schedule = await this.schedulesService.delete(id, userId);
    return this.toResponse(schedule);
  }

  @Get()
  async findAllForUser(@Query('userId') userId: string) {
    if (!userId) {
      return [];
    }
    const items = await this.schedulesService.findAllByUserId(userId);
    return items.map((s) => this.toResponse(s));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const schedule = await this.schedulesService.findById(id);
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }
    return this.toResponse(schedule);
  }

  private toResponse(schedule: ScheduleDocument) {
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
