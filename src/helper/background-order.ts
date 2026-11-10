import type { TimelineDate } from '../type/timeline-render';
import { parseTimelineDate } from './normalize-vis-date';

type BackgroundLike = {
	start: TimelineDate;
	end: TimelineDate;
	group?: string;
};

export type OrderedBackground<T> = {
	background: T;
	/** 1-based position inside the background's group. */
	order: number;
};

type IndexedBackground<T> = {
	background: T;
	index: number;
	start: number;
	end: number;
	groupKey: string;
};

/**
 * Sort backgrounds by start/end inside each group and assign a 1-based
 * order. Groups are independent; a background without `group` forms its own
 * sequence. The result keeps groups in first-appearance order.
 */
export function orderBackgroundsByGroup<T extends BackgroundLike>(
	backgrounds: T[],
): Array<OrderedBackground<T>> {
	const indexed: Array<IndexedBackground<T>> = backgrounds.map(
		(background, index) => ({
			background,
			index,
			start: parseTimelineDate(background.start)?.getTime() ?? 0,
			end: parseTimelineDate(background.end)?.getTime() ?? 0,
			groupKey: background.group == null ? '' : String(background.group),
		}),
	);

	const byGroup = new Map<string, Array<IndexedBackground<T>>>();
	for (const background of indexed) {
		const group = byGroup.get(background.groupKey);
		if (group) {
			group.push(background);
		} else {
			byGroup.set(background.groupKey, [background]);
		}
	}

	const ordered: Array<OrderedBackground<T>> = [];
	for (const group of byGroup.values()) {
		group.sort(compareBackgrounds);
		group.forEach((background, index) => {
			ordered.push({ background: background.background, order: index + 1 });
		});
	}

	return ordered;
}

function compareBackgrounds<T>(
	a: IndexedBackground<T>,
	b: IndexedBackground<T>,
): number {
	return a.start - b.start || a.end - b.end || a.index - b.index;
}
