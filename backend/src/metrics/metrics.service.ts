import { Injectable } from '@nestjs/common';
import {
	type IntensityScale,
	type MetricIntensityLevel,
	type ScheduleDuration,
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
