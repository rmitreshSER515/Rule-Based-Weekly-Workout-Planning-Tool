import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';

@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateExerciseDto) {
    const exercise = await this.exercisesService.create(dto);
    return {
      id: exercise._id.toString(),
      userId: exercise.userId,
      name: exercise.name,
      notes: exercise.notes,
      createdAt: exercise.get('createdAt'),
      updatedAt: exercise.get('updatedAt'),
    };
  }

  @Get()
  async findAllForUser(@Query('userId') userId: string) {
    if (!userId) {
      return [];
    }
    const items = await this.exercisesService.findByUserId(userId);
    return items.map((exercise) => ({
      id: exercise._id.toString(),
      userId: exercise.userId,
      name: exercise.name,
      notes: exercise.notes,
      createdAt: exercise.get('createdAt'),
      updatedAt: exercise.get('updatedAt'),
    }));
  }
}
