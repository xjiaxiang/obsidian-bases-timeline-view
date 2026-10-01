import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../src/helper/logger';
import { normalizeVisDate } from '../src/helper/normalize-vis-date';

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
		it('formats a local Date as YYYY-MM-DD', () => {
			expect(normalizeVisDate(new Date(2024, 5, 9))).toBe('2024-06-09');
		});

		it('formats a local Date near year boundaries', () => {
			expect(normalizeVisDate(new Date(2024, 0, 1))).toBe('2024-01-01');
			expect(normalizeVisDate(new Date(2024, 11, 31))).toBe('2024-12-31');
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

	describe('local Date vs coerced YYYY-MM-DD', () => {
		it('matches padYmd for a constructed local Date', () => {
			const y = 2018;
			const m = 11;
			const d = 5;
			expect(normalizeVisDate(new Date(y, m - 1, d))).toBe(padYmd(y, m, d));
		});
	});
});
