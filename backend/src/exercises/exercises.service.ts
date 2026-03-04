import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise, ExerciseDocument } from './entities/exercise.schema';
import type { CreateExerciseDto } from './dto/create-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
  ) {}

  async create(dto: CreateExerciseDto): Promise<ExerciseDocument> {
    const doc = new this.exerciseModel({
      userId: dto.userId,
      name: dto.name.trim(),
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
}
