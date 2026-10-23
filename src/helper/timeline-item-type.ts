import { logger } from './logger';
import type { TimelineItemType } from '../type/timeline-render';

const ITEM_TYPES: ReadonlySet<string> = new Set([
	'box',
	'point',
	'range',
]);

/**
 * Validate a property value as a vis-timeline item type.
 * Must match exactly (`box` | `point` | `range`), same as vis-timeline.
 * Unknown values return `undefined`; pass `context` to log them.
 */
export function normalizeItemType(
	raw: unknown,
	context?: string,
): TimelineItemType | undefined {
	// vis treats a missing/falsy `type` as "use the default".
	if (raw == null || raw === '') {
		return undefined;
	}

	if (typeof raw === 'string' && ITEM_TYPES.has(raw)) {
		return raw as TimelineItemType;
	}

	if (context) {
		logger.warn(`invalid item type "${String(raw)}" for ${context}, ignored`);
	}
	return undefined;
}
