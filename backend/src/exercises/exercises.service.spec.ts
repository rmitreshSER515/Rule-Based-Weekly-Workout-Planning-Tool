import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ExercisesService } from './exercises.service';
import { Exercise } from './entities/exercise.schema';

describe('ExercisesService', () => {
  let service: ExercisesService;

  beforeEach(async () => {
    const saveMock = jest.fn();
    const mockModel = function () {
      return { save: saveMock };
    };
    mockModel.find = jest
      .fn()
      .mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn() }) });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExercisesService,
        {
          provide: getModelToken(Exercise.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<ExercisesService>(ExercisesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
