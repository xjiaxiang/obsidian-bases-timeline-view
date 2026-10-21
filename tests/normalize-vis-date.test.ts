import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../src/helper/logger';
import {
	compareTimelineDates,
	normalizeVisDate,
	parseTimelineDate,
} from '../src/helper/normalize-vis-date';

vi.mock('../src/helper/logger', () => ({
	logger: {
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

function padYmd(y: number, m: number, d: number): string {
	return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

describe('normalizeVisDate', () => {
	beforeEach(() => {
		vi.mocked(logger.warn).mockClear();
	});

	describe('empty / missing', () => {
		it.each([null, undefined, ''])('returns undefined for %j', (raw) => {
			expect(normalizeVisDate(raw)).toBeUndefined();
			expect(logger.warn).not.toHaveBeenCalled();
		});

		it('returns undefined for whitespace-only strings', () => {
			expect(normalizeVisDate('   ')).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith('invalid date:    ');
		});
	});

	describe('strings', () => {
		it('keeps a full ISO date', () => {
			expect(normalizeVisDate('2025-03-15')).toBe('2025-03-15');
		});

		it('trims surrounding whitespace', () => {
			expect(normalizeVisDate('  2025-03-15  ')).toBe('2025-03-15');
		});

		it('expands a year-only value to January 1', () => {
			expect(normalizeVisDate('2025')).toBe('2025-01-01');
		});

		it('expands a year-month value to the first day', () => {
			expect(normalizeVisDate('2025-01')).toBe('2025-01-01');
		});

		it('accepts a historical calendar date', () => {
			expect(normalizeVisDate('1057-01-01')).toBe('1057-01-01');
		});

		it('parses an ISO datetime by its date prefix', () => {
			expect(normalizeVisDate('2025-03-15T12:30:00')).toBe('2025-03-15');
		});

		it('returns undefined for a non-date string', () => {
			expect(normalizeVisDate('not-a-date')).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith('invalid date: not-a-date');
		});

		it('returns undefined for an impossible calendar day', () => {
			expect(normalizeVisDate('2025-02-30')).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith('invalid date: 2025-02-30');
		});
	});

	describe('Date', () => {
		it('formats a UTC Date as YYYY-MM-DD', () => {
			expect(normalizeVisDate(new Date(Date.UTC(2024, 5, 9)))).toBe(
				'2024-06-09',
			);
		});

		it('formats a UTC Date near year boundaries', () => {
			expect(normalizeVisDate(new Date(Date.UTC(2024, 0, 1)))).toBe(
				'2024-01-01',
			);
			expect(normalizeVisDate(new Date(Date.UTC(2024, 11, 31)))).toBe(
				'2024-12-31',
			);
		});

		it('returns undefined for an invalid Date', () => {
			const invalid = new Date('not-a-date');
			expect(normalizeVisDate(invalid)).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith('invalid date: Invalid Date');
		});
	});

	describe('objects', () => {
		it('returns undefined for a plain object', () => {
			expect(normalizeVisDate({ foo: 1 })).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith('invalid date: [object Object]');
		});
	});

	describe('date-like objects', () => {
		/** Minimal stand-in for Luxon DateTime as returned by Dataview. */
		const luxonDateTime = (
			year: number,
			month: number,
			day: number,
			hour = 0,
		) => ({
			isLuxonDateTime: true,
			isValid: true,
			year,
			month,
			day,
			hour,
			minute: 0,
			second: 0,
			millisecond: 0,
		});

		it('normalizes a Luxon DateTime by its calendar fields', () => {
			expect(normalizeVisDate(luxonDateTime(2025, 3, 15))).toBe('2025-03-15');
		});

		it('uses the DateTime calendar day, not its UTC instant', () => {
			// As an instant, local midnight in UTC+8 is the previous UTC day.
			expect(
				parseTimelineDate(luxonDateTime(2025, 3, 15))?.toISOString(),
			).toBe('2025-03-15T00:00:00.000Z');
		});

		it('preserves the time of day from a DateTime', () => {
			expect(
				parseTimelineDate(luxonDateTime(2025, 3, 15, 23))?.toISOString(),
			).toBe('2025-03-15T23:00:00.000Z');
		});

		it('normalizes a BCE DateTime', () => {
			expect(normalizeVisDate(luxonDateTime(-44, 3, 15))).toBe(
				'-000044-03-15',
			);
		});

		it('returns undefined for an invalid DateTime', () => {
			expect(
				normalizeVisDate({
					isLuxonDateTime: true,
					isValid: false,
					year: Number.NaN,
					month: Number.NaN,
					day: Number.NaN,
				}),
			).toBeUndefined();
		});

		it('returns undefined for an impossible DateTime day', () => {
			expect(normalizeVisDate(luxonDateTime(2025, 2, 30))).toBeUndefined();
		});

		it('normalizes a Moment-like object', () => {
			const momentLike = {
				year: () => 2025,
				month: () => 2, // 0-based March
				date: () => 15,
				isValid: () => true,
			};
			expect(normalizeVisDate(momentLike)).toBe('2025-03-15');
		});

		it('returns undefined for an invalid Moment-like object', () => {
			const momentLike = {
				year: () => Number.NaN,
				month: () => Number.NaN,
				date: () => Number.NaN,
				isValid: () => false,
			};
			expect(normalizeVisDate(momentLike)).toBeUndefined();
		});
	});

	describe('numbers and other primitives', () => {
		it('treats a four-digit number as a year', () => {
			expect(normalizeVisDate(2025)).toBe('2025-01-01');
		});

		it('returns undefined for NaN', () => {
			expect(normalizeVisDate(Number.NaN)).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith('invalid date: NaN');
		});

		it('returns undefined for Infinity', () => {
			expect(normalizeVisDate(Number.POSITIVE_INFINITY)).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith('invalid date: Infinity');
		});

		it('returns undefined for booleans', () => {
			expect(normalizeVisDate(true)).toBeUndefined();
			expect(logger.warn).toHaveBeenCalledWith('invalid date: true');
		});
	});

	describe('UTC Date vs coerced YYYY-MM-DD', () => {
		it('matches padYmd for a constructed UTC Date', () => {
			const y = 2018;
			const m = 11;
			const d = 5;
			expect(normalizeVisDate(new Date(Date.UTC(y, m - 1, d)))).toBe(
				padYmd(y, m, d),
			);
		});
	});
});

describe('extended calendar dates', () => {
	it.each([
		[-21, '-000021-01-01'],
		['-21', '-000021-01-01'],
		[932, '0932-01-01'],
		['932', '0932-01-01'],
		['-21-03', '-000021-03-01'],
		['932-03-15', '0932-03-15'],
		['-0044', '-000044-01-01'],
		[-44, '-000044-01-01'],
		['-0044-03', '-000044-03-01'],
		['-0044-03-15', '-000044-03-15'],
		['0000', '0000-01-01'],
		[0, '0000-01-01'],
		['0001', '0001-01-01'],
		['0099-12-31', '0099-12-31'],
		[10000, '+010000-01-01'],
		['-271821-04-20', '-271821-04-20'],
		['275760-09-13', '+275760-09-13'],
		[new Date(-8640000000000000), '-271821-04-20'],
		[new Date(8640000000000000), '+275760-09-13'],
		['0000-02-29', '0000-02-29'],
		['-0004-02-29', '-000004-02-29'],
	])('normalizes %s without changing its year', (raw, expected) => {
		expect(normalizeVisDate(raw)).toBe(expected);
		expect(normalizeVisDate(expected)).toBe(expected);
		expect(parseTimelineDate(expected)?.toISOString().split('T')[0]).toBe(
			expected,
		);
	});

	it.each([
		'-271821',
		'-271821-04-19',
		'275760-09-14',
		'275761',
		'-0001-02-29',
		'1900-02-29',
		'2025-00-01',
		'2025-13-01',
		'2025-01-00',
		'2025-04-31',
		'2025-1',
		'2025-01-1',
		'2025-01-01junk',
		2025.5,
		8640000000000000,
	])('rejects invalid or out-of-range input %s', (raw) => {
		expect(normalizeVisDate(raw)).toBeUndefined();
	});

	it('sorts BCE, small, and expanded years by time', () => {
		const values = [
			'+010000-01-01',
			'9999-01-01',
			'-000001-01-01',
			'-000044-01-01',
			'0000-01-01',
		];
		expect(values.sort(compareTimelineDates)).toEqual([
			'-000044-01-01',
			'-000001-01-01',
			'0000-01-01',
			'9999-01-01',
			'+010000-01-01',
		]);
	});

	it('uses the UTC day for Date objects regardless of source offset', () => {
		expect(normalizeVisDate(new Date('2025-01-01T00:30:00+08:00'))).toBe(
			'2024-12-31',
		);
	});
});
