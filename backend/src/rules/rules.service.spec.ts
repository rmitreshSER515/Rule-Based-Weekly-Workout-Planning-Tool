import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RulesService } from './rules.service';
import { Rule } from './entities/rule.schema';

describe('RulesService', () => {
  let service: RulesService;

  beforeEach(async () => {
    const saveMock = jest.fn();
    const mockModel = function () {
      return { save: saveMock };
    };
    mockModel.find = jest
      .fn()
      .mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn() }) });
    mockModel.findOneAndUpdate = jest
      .fn()
      .mockReturnValue({ exec: jest.fn() });
    mockModel.findOneAndDelete = jest
      .fn()
      .mockReturnValue({ exec: jest.fn() });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RulesService,
        {
          provide: getModelToken(Rule.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<RulesService>(RulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
