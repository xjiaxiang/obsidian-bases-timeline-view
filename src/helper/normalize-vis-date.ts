import { logger } from './logger';

/** Numbers represent years. Missing months/days default to January/1.
 * Dates use their UTC calendar day; signed years use astronomical numbering.
 * Emit ISO expanded years so downstream parsers never guess negative years.
 */
export function normalizeVisDate(raw: unknown): string | undefined {
	if (raw == null || raw === '') return undefined;
	const date = parseTimelineDate(raw);
	if (date) return date.toISOString().split('T')[0];
	logger.warn(`invalid date: ${String(raw)}`);
	return undefined;
}

/**
 * Parse calendar input without native string-date guessing or years 0–99 remapping.
 * Accepts strings, numeric years, Date, and date-like objects
 * (Luxon DateTime from Dataview, Moment from Obsidian).
 */
export function parseTimelineDate(raw: unknown): Date | undefined {
	if (raw instanceof Date) {
		return Number.isFinite(raw.getTime()) ? new Date(raw.getTime()) : undefined;
	}
	if (typeof raw === 'number' && !Number.isInteger(raw)) return undefined;
	if (typeof raw !== 'string' && typeof raw !== 'number') {
		return typeof raw === 'object' && raw !== null
			? parseDateLike(raw as Record<string, unknown>)
			: undefined;
	}
	const text = String(raw).trim();
	const parts = /^([+-]?\d{1,6})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(text);
	if (!parts) {
		// Preserve ISO datetime support for Dataview/Luxon string values.
		if (!/^[+-]?\d{4,6}-\d{2}-\d{2}T/.test(text)) return undefined;
		const day = parseTimelineDate(text.split('T')[0]);
		const date = new Date(text);
		return day && Number.isFinite(date.getTime()) ? date : undefined;
	}
	return buildCalendarDate({
		year: Number(parts[1]),
		month: Number(parts[2] ?? 1),
		day: Number(parts[3] ?? 1),
	});
}

type CalendarParts = {
	year: number;
	/** 1–12 */
	month: number;
	day: number;
	hour?: number;
	minute?: number;
	second?: number;
	millisecond?: number;
};

type MomentLike = {
	isValid?: () => boolean;
	year: () => number;
	/** 0–11 */
	month: () => number;
	date: () => number;
	hour?: () => number;
	minute?: () => number;
	second?: () => number;
	millisecond?: () => number;
};

/**
 * Read calendar fields in the object's own zone so the rendered day matches
 * what Dataview / Obsidian displays on the device, independent of UTC offset.
 */
function parseDateLike(raw: Record<string, unknown>): Date | undefined {
	// Luxon DateTime (Dataview): calendar fields are getters.
	if (
		typeof raw.year === 'number' &&
		typeof raw.month === 'number' &&
		typeof raw.day === 'number'
	) {
		return buildCalendarDate({
			year: raw.year,
			month: raw.month,
			day: raw.day,
			hour: optionalNumber(raw.hour),
			minute: optionalNumber(raw.minute),
			second: optionalNumber(raw.second),
			millisecond: optionalNumber(raw.millisecond),
		});
	}

	// Moment (Obsidian): accessor methods, month is 0-based.
	if (
		typeof raw.year === 'function' &&
		typeof raw.month === 'function' &&
		typeof raw.date === 'function'
	) {
		const moment = raw as unknown as MomentLike;
		if (typeof moment.isValid === 'function' && !moment.isValid()) {
			return undefined;
		}
		return buildCalendarDate({
			year: moment.year(),
			month: moment.month() + 1,
			day: moment.date(),
			hour: moment.hour?.(),
			minute: moment.minute?.(),
			second: moment.second?.(),
			millisecond: moment.millisecond?.(),
		});
	}

	return undefined;
}

function optionalNumber(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Build a UTC Date from calendar parts, rejecting rollover (e.g. Feb 30). */
function buildCalendarDate(parts: CalendarParts): Date | undefined {
	const { year, month, day } = parts;
	const hour = parts.hour ?? 0;
	const minute = parts.minute ?? 0;
	const second = parts.second ?? 0;
	const millisecond = parts.millisecond ?? 0;
	if (
		![year, month, day, hour, minute, second, millisecond].every(
			Number.isInteger,
		)
	) {
		return undefined;
	}

	const date = new Date(0);
	date.setUTCFullYear(year, month - 1, day);
	date.setUTCHours(hour, minute, second, millisecond);
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day ||
		date.getUTCHours() !== hour ||
		date.getUTCMinutes() !== minute ||
		date.getUTCSeconds() !== second ||
		date.getUTCMilliseconds() !== millisecond
	) {
		return undefined;
	}
	return date;
}

/** Compare normalized calendar strings chronologically, including BCE/expanded years. */
export function compareTimelineDates(a: string, b: string): number {
	return parseTimelineDate(a)!.getTime() - parseTimelineDate(b)!.getTime();
}
