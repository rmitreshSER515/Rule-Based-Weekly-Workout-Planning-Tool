import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise, ExerciseDocument } from './entities/exercise.schema';
import type { CreateExerciseDto } from './dto/create-exercise.dto';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class ExercisesService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
  ) {}

  async create(dto: CreateExerciseDto): Promise<ExerciseDocument> {
    const name = dto.name.trim();
    const existing = await this.exerciseModel
      .findOne({
        userId: dto.userId,
        name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') },
      })
      .exec();
    if (existing) {
      throw new ConflictException('An exercise with this name already exists');
    }

    const doc = new this.exerciseModel({
      userId: dto.userId,
      name,
      notes: (dto.notes ?? '').trim(),
    });
    return doc.save();
  }

  async findByUserId(userId: string): Promise<ExerciseDocument[]> {
    return this.exerciseModel
      .find({ userId })
      .sort({ createdAt: 1 })
      .exec();
  }

  async delete(id: string, userId: string): Promise<ExerciseDocument> {
    const exercise = await this.exerciseModel.findById(id).exec();

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    if (!userId || exercise.userId !== userId) {
      throw new ForbiddenException('Not allowed to delete this exercise');
    }

    await this.exerciseModel.deleteOne({ _id: id }).exec();

    return exercise;
  }
}