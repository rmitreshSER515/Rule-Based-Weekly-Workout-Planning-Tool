import { Injectable } from '@nestjs/common';
import {
	type ExerciseIntensitySummary,
	type IntensityScale,
	type MetricIntensityLevel,
	type ScheduleCalendarExerciseEntry,
	type ScheduleCalendarExercises,
	type ScheduleDuration,
	type ScheduleMetrics,
} from './types/metrics.types';

@Injectable()
export class MetricsService {
	private static readonly INTENSITY_SCALE: Record<
		MetricIntensityLevel,
		IntensityScale
	> = {
		recovery: 1,
		easy: 2,
		medium: 3,
		hard: 4,
		allOut: 5,
	};

	private static readonly INTENSITY_ALIASES: Record<string, MetricIntensityLevel> =
		{
			recovery: 'recovery',
			easy: 'easy',
			medium: 'medium',
			hard: 'hard',
			allout: 'allOut',
			'all-out': 'allOut',
			'all out': 'allOut',
			'all-out effort': 'allOut',
			'all out effort': 'allOut',
			low: 'easy',
			moderate: 'medium',
			high: 'hard',
		};

	normalizeIntensity(value: string | null | undefined): MetricIntensityLevel | null {
		if (!value) {
			return null;
		}

		const normalizedKey = value.trim().toLowerCase();
		return MetricsService.INTENSITY_ALIASES[normalizedKey] ?? null;
	}

	getIntensityScale(level: MetricIntensityLevel): IntensityScale {
		return MetricsService.INTENSITY_SCALE[level];
	}

	getIntensityScaleFromRaw(value: string | null | undefined): IntensityScale | null {
		const level = this.normalizeIntensity(value);
		if (!level) {
			return null;
		}

		return this.getIntensityScale(level);
	}

	parseDurationToMinutes(duration: ScheduleDuration | null | undefined): number {
		if (!duration) {
			return 0;
		}

		const hours = this.toNonNegativeInteger(duration.hours);
		const minutes = this.toNonNegativeInteger(duration.minutes);
		return hours * 60 + minutes;
	}

	computeScheduleMetrics(
		calendarExercises: ScheduleCalendarExercises,
	): ScheduleMetrics {
		const entries = this.flattenCalendarExercises(calendarExercises);
		const totalExercises = entries.length;

		const totalWorkoutMinutes = entries.reduce((sum, entry) => {
			return sum + this.parseDurationToMinutes(entry.duration);
		}, 0);

		const averageIntensity = this.calculateAverageIntensity(entries);
		const exerciseIntensityBreakdown = this.aggregateExerciseIntensity(entries);

		return {
			totalExercises,
			totalWorkoutMinutes,
			averageIntensity,
			exerciseIntensityBreakdown,
		};
	}

	private flattenCalendarExercises(
		calendarExercises: ScheduleCalendarExercises,
	): ScheduleCalendarExerciseEntry[] {
		if (!calendarExercises || typeof calendarExercises !== 'object') {
			return [];
		}

		return Object.values(calendarExercises).flatMap((entries) =>
			Array.isArray(entries) ? entries : [],
		);
	}

	private calculateAverageIntensity(
		entries: ScheduleCalendarExerciseEntry[],
	): number {
		const scales = entries
			.map((entry) => this.getIntensityScaleFromRaw(entry.intensity))
			.filter((value): value is IntensityScale => value !== null);

		if (scales.length === 0) {
			return 0;
		}

		const totalScale = scales.reduce((sum, scale) => sum + scale, 0);
		return Math.round(totalScale / scales.length);
	}

	private aggregateExerciseIntensity(
		entries: ScheduleCalendarExerciseEntry[],
	): ExerciseIntensitySummary[] {
		const grouped = new Map<string, ExerciseIntensitySummary>();

		for (const entry of entries) {
			const normalizedIntensity = this.normalizeIntensity(entry.intensity);
			if (!normalizedIntensity) {
				continue;
			}

			const key = `${entry.name}::${normalizedIntensity}`;
			const existing = grouped.get(key);

			if (existing) {
				existing.count += 1;
				continue;
			}

			grouped.set(key, {
				name: entry.name,
				intensity: normalizedIntensity,
				count: 1,
			});
		}

		return [...grouped.values()].sort((left, right) => {
			const nameOrder = left.name.localeCompare(right.name);
			if (nameOrder !== 0) {
				return nameOrder;
			}

			return this.getIntensityScale(left.intensity) - this.getIntensityScale(right.intensity);
		});
	}

	private toNonNegativeInteger(value: string | number | null | undefined): number {
		if (value === null || value === undefined) {
			return 0;
		}

		const parsed =
			typeof value === 'number' ? value : Number.parseInt(String(value).trim(), 10);

		if (!Number.isFinite(parsed) || parsed < 0) {
			return 0;
		}

		return Math.floor(parsed);
	}
}
