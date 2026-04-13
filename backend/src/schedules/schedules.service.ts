import { ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Schedule, ScheduleDocument } from './entities/schedule.schema';
import type { SaveScheduleDto } from './dto/save-schedule.dto';

@Injectable()
export class SchedulesService implements OnModuleInit {
  constructor(
    @InjectModel(Schedule.name)
    private readonly scheduleModel: Model<ScheduleDocument>,
  ) {}

  async onModuleInit() {
    const collection = this.scheduleModel.collection;
    try {
      await collection.dropIndex('userId_1');
    } catch (err: any) {
      if (err?.codeName !== 'IndexNotFound') {
        console.warn('Failed to drop schedules userId index', err);
      }
    }
    try {
      await collection.createIndex({ userId: 1 });
    } catch (err) {
      console.warn('Failed to ensure schedules userId index', err);
    }
  }

  async create(dto: SaveScheduleDto): Promise<ScheduleDocument> {
    const doc = new this.scheduleModel({
      userId: dto.userId,
      title: dto.title.trim(),
      startDate: dto.startDate,
      endDate: dto.endDate,
      selectedRuleIds: dto.selectedRuleIds ?? [],
      calendarExercises: dto.calendarExercises ?? {},
    });
    return doc.save();
  }

  async update(
    id: string,
    dto: SaveScheduleDto,
  ): Promise<ScheduleDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Schedule not found');
    }
    const existing = await this.scheduleModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Schedule not found');
    }
    if (existing.userId !== dto.userId) {
      throw new ForbiddenException('Cannot update another user schedule');
    }
    existing.set({
      title: dto.title.trim(),
      startDate: dto.startDate,
      endDate: dto.endDate,
      selectedRuleIds: dto.selectedRuleIds ?? [],
      calendarExercises: dto.calendarExercises ?? {},
    });
    return existing.save();
  }

  async findAllByUserId(userId: string): Promise<ScheduleDocument[]> {
    return this.scheduleModel
      .find({ userId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<ScheduleDocument | null> {
    if (!isValidObjectId(id)) {
      return null;
    }
    return this.scheduleModel.findById(id).exec();
  }

  async delete(id: string, userId: string): Promise<ScheduleDocument> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Schedule not found');
    }
    const existing = await this.scheduleModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Schedule not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('Cannot delete another user schedule');
    }
    await this.scheduleModel.deleteOne({ _id: id }).exec();
    return existing;
  }
}
