import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SchedulesService } from './schedules.service';
import { Schedule } from './entities/schedule.schema';

describe('SchedulesService', () => {
  let service: SchedulesService;

  beforeEach(async () => {
    const saveMock = jest.fn();
    const mockModel = function () {
      return { save: saveMock };
    };
    mockModel.find = jest
      .fn()
      .mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn() }) });
    mockModel.findById = jest
      .fn()
      .mockReturnValue({ exec: jest.fn() });
    mockModel.collection = {
      dropIndex: jest.fn().mockResolvedValue(undefined),
      createIndex: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: getModelToken(Schedule.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
