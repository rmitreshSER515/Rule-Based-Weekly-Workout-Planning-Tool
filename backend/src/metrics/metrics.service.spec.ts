import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import type { ScheduleCalendarExercises } from './types/metrics.types';

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

  describe('computeScheduleMetrics', () => {
    it('returns zeros and empty breakdown for empty schedules', () => {
      expect(service.computeScheduleMetrics({})).toEqual({
        totalExercises: 0,
        totalWorkoutMinutes: 0,
        averageIntensity: 0,
        exerciseIntensityBreakdown: [],
      });
    });

    it('computes totals, rounded average intensity, and grouped breakdown', () => {
      const calendarExercises: ScheduleCalendarExercises = {
        '2026-03-23': [
          {
            id: '1',
            exerciseId: 'e1',
            name: 'Run',
            intensity: 'easy',
            duration: { hours: '1', minutes: '0' },
          },
          {
            id: '2',
            exerciseId: 'e2',
            name: 'Bike',
            intensity: 'hard',
            duration: { hours: '0', minutes: '30' },
          },
        ],
        '2026-03-24': [
          {
            id: '3',
            exerciseId: 'e3',
            name: 'Run',
            intensity: 'easy',
            duration: { hours: '0', minutes: '45' },
          },
        ],
      };

      expect(service.computeScheduleMetrics(calendarExercises)).toEqual({
        totalExercises: 3,
        totalWorkoutMinutes: 135,
        averageIntensity: 3,
        exerciseIntensityBreakdown: [
          { name: 'Bike', intensity: 'hard', count: 1 },
          { name: 'Run', intensity: 'easy', count: 2 },
        ],
      });
    });

    it('counts unknown intensities in total exercises but excludes them from average and breakdown', () => {
      const calendarExercises: ScheduleCalendarExercises = {
        '2026-03-23': [
          {
            id: '1',
            exerciseId: 'e1',
            name: 'Run',
            intensity: 'easy',
            duration: { hours: '0', minutes: '20' },
          },
          {
            id: '2',
            exerciseId: 'e2',
            name: 'Mystery',
            intensity: 'unknown',
            duration: { hours: '0', minutes: '40' },
          },
        ],
      };

      expect(service.computeScheduleMetrics(calendarExercises)).toEqual({
        totalExercises: 2,
        totalWorkoutMinutes: 60,
        averageIntensity: 2,
        exerciseIntensityBreakdown: [
          { name: 'Run', intensity: 'easy', count: 1 },
        ],
      });
    });

    it('normalizes intensity aliases and aggregates duplicate name+intensity pairs', () => {
      const calendarExercises: ScheduleCalendarExercises = {
        '2026-03-23': [
          {
            id: '1',
            exerciseId: 'e1',
            name: 'Swim',
            intensity: 'all-out effort',
            duration: { hours: '0', minutes: '25' },
          },
          {
            id: '2',
            exerciseId: 'e2',
            name: 'Swim',
            intensity: 'all out',
            duration: { hours: '0', minutes: '35' },
          },
          {
            id: '3',
            exerciseId: 'e3',
            name: 'Swim',
            intensity: 'low',
            duration: { hours: '0', minutes: '30' },
          },
        ],
      };

      expect(service.computeScheduleMetrics(calendarExercises)).toEqual({
        totalExercises: 3,
        totalWorkoutMinutes: 90,
        averageIntensity: 4,
        exerciseIntensityBreakdown: [
          { name: 'Swim', intensity: 'easy', count: 1 },
          { name: 'Swim', intensity: 'allOut', count: 2 },
        ],
      });
    });

    it('separates same exercise name by different intensity levels', () => {
      const calendarExercises: ScheduleCalendarExercises = {
        '2026-03-23': [
          {
            id: '1',
            exerciseId: 'e1',
            name: 'Run',
            intensity: 'easy',
            duration: { hours: '0', minutes: '30' },
          },
          {
            id: '2',
            exerciseId: 'e2',
            name: 'Run',
            intensity: 'hard',
            duration: { hours: '0', minutes: '30' },
          },
        ],
      };

      expect(service.computeScheduleMetrics(calendarExercises).exerciseIntensityBreakdown).toEqual([
        { name: 'Run', intensity: 'easy', count: 1 },
        { name: 'Run', intensity: 'hard', count: 1 },
      ]);
    });

    it('treats invalid durations as zero minutes', () => {
      const calendarExercises: ScheduleCalendarExercises = {
        '2026-03-23': [
          {
            id: '1',
            exerciseId: 'e1',
            name: 'Walk',
            intensity: 'recovery',
            duration: { hours: '-1', minutes: '30' },
          },
          {
            id: '2',
            exerciseId: 'e2',
            name: 'Walk',
            intensity: 'recovery',
            duration: { hours: 'abc', minutes: 'def' },
          },
        ],
      };

      expect(service.computeScheduleMetrics(calendarExercises).totalWorkoutMinutes).toBe(30);
    });
  });
});
