import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule, ScheduleDocument } from './entities/schedule.schema';
import type { SaveScheduleDto } from './dto/save-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectModel(Schedule.name)
    private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async upsert(dto: SaveScheduleDto): Promise<ScheduleDocument> {
    return this.scheduleModel.findOneAndUpdate(
      { userId: dto.userId },
      {
        $set: {
          title: dto.title.trim(),
          startDate: dto.startDate,
          endDate: dto.endDate,
          selectedRuleIds: dto.selectedRuleIds ?? [],
          calendarExercises: dto.calendarExercises ?? {},
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async findByUserId(userId: string): Promise<ScheduleDocument | null> {
    return this.scheduleModel.findOne({ userId }).exec();
  }
}
