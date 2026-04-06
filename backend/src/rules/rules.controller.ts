import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Delete,
  Query,
} from '@nestjs/common';

import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';

@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRuleDto) {
    const rule = await this.rulesService.create(dto);

    return {
      id: rule._id.toString(),
      userId: rule.userId,
      name: rule.name,
      ifExercise: rule.ifExercise,
      ifActivityType: rule.ifActivityType,
      ifTiming: rule.ifTiming,
      thenExercise: rule.thenExercise,
      thenActivityType: rule.thenActivityType,
      thenRestriction: rule.thenRestriction,
      isActive: rule.isActive,
      createdAt: rule.get('createdAt'),
      updatedAt: rule.get('updatedAt'),
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: CreateRuleDto) {
    const rule = await this.rulesService.update(id, dto);

    if (!rule) {
      throw new NotFoundException('Rule not found');
    }

    return {
      id: rule._id.toString(),
      userId: rule.userId,
      name: rule.name,
      ifExercise: rule.ifExercise,
      ifActivityType: rule.ifActivityType,
      ifTiming: rule.ifTiming,
      thenExercise: rule.thenExercise,
      thenActivityType: rule.thenActivityType,
      thenRestriction: rule.thenRestriction,
      isActive: rule.isActive,
      createdAt: rule.get('createdAt'),
      updatedAt: rule.get('updatedAt'),
    };
  }

  @Get()
  async findAllForUser(@Query('userId') userId: string) {
    if (!userId) {
      return [];
    }

    const items = await this.rulesService.findByUserId(userId);

    return items.map((rule) => ({
      id: rule._id.toString(),
      userId: rule.userId,
      name: rule.name,
      ifExercise: rule.ifExercise,
      ifActivityType: rule.ifActivityType,
      ifTiming: rule.ifTiming,
      thenExercise: rule.thenExercise,
      thenActivityType: rule.thenActivityType,
      thenRestriction: rule.thenRestriction,
      isActive: rule.isActive,
      createdAt: rule.get('createdAt'),
      updatedAt: rule.get('updatedAt'),
    }));
  }

  @Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
async remove(@Param('id') id: string, @Query('userId') userId: string) {
  const rule = await this.rulesService.remove(id, userId);
  if (!rule) {
    throw new NotFoundException('Rule not found');
  }
}
}

