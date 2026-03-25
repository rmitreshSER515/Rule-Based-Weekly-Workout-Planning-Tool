import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('normalizes intensity aliases to canonical values', () => {
    expect(service.normalizeIntensity('all-out effort')).toBe('allOut');
    expect(service.normalizeIntensity(' allOut ')).toBe('allOut');
    expect(service.normalizeIntensity('LOW')).toBe('easy');
    expect(service.normalizeIntensity('moderate')).toBe('medium');
    expect(service.normalizeIntensity('high')).toBe('hard');
  });

  it('returns null for unknown intensity values', () => {
    expect(service.normalizeIntensity('impossible')).toBeNull();
    expect(service.normalizeIntensity('')).toBeNull();
    expect(service.normalizeIntensity(undefined)).toBeNull();
  });

  it('maps canonical intensity to scale values', () => {
    expect(service.getIntensityScale('recovery')).toBe(1);
    expect(service.getIntensityScale('easy')).toBe(2);
    expect(service.getIntensityScale('medium')).toBe(3);
    expect(service.getIntensityScale('hard')).toBe(4);
    expect(service.getIntensityScale('allOut')).toBe(5);
  });

  it('maps raw intensity strings to scale values', () => {
    expect(service.getIntensityScaleFromRaw('all out')).toBe(5);
    expect(service.getIntensityScaleFromRaw('low')).toBe(2);
    expect(service.getIntensityScaleFromRaw('unknown')).toBeNull();
  });

  it('parses duration values into total minutes', () => {
    expect(service.parseDurationToMinutes({ hours: '1', minutes: '30' })).toBe(90);
    expect(service.parseDurationToMinutes({ hours: 2, minutes: 15 })).toBe(135);
    expect(service.parseDurationToMinutes({ hours: ' 0 ', minutes: '59' })).toBe(59);
  });

  it('handles invalid duration values safely', () => {
    expect(service.parseDurationToMinutes(undefined)).toBe(0);
    expect(service.parseDurationToMinutes(null)).toBe(0);
    expect(service.parseDurationToMinutes({ hours: '-2', minutes: '30' })).toBe(30);
    expect(service.parseDurationToMinutes({ hours: 'abc', minutes: 'def' })).toBe(0);
  });
});
