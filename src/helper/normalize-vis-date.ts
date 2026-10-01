import { moment } from 'obsidian';
import { logger } from './logger';

/**
 * Normalize a date-like value to `YYYY-MM-DD` via moment.
 * Used by both Bases conversion and the Dataview API.
 * Accepts strings, Date, and numbers.
 */
export function normalizeVisDate(raw: unknown): string | undefined {
	if (raw == null || raw === '') {
		return undefined;
	}

	const asString = coerceToDateString(raw);
	if (!asString || asString === '[object Object]') {
		logger.warn(`invalid date: ${String(raw)}`);
		return undefined;
	}

	return normalizeDate(asString);
}

function coerceToDateString(raw: unknown): string | undefined {
	if (typeof raw === 'string') {
		return raw.trim();
	}

	if (raw instanceof Date) {
		if (Number.isNaN(raw.getTime())) {
			return undefined;
		}
		const y = raw.getFullYear();
		const m = String(raw.getMonth() + 1).padStart(2, '0');
		const d = String(raw.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	if (typeof raw === 'number') {
		return String(raw);
	}

	return String(raw).trim();
}

function normalizeDate(date: string): string | undefined {
	const normalized = (moment as any)(date);
	if (normalized.isValid()) {
		return normalized.format('YYYY-MM-DD');
	}

	logger.warn(`invalid date: ${date}`);
	return undefined;
}
