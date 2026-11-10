import type { Timeline } from 'vis-timeline/esnext';

/**
 * Apply `data-*` attributes to the `.vis-item.vis-background` element.
 *
 * vis-timeline only writes the `dataAttributes` option to the item's content
 * element, so background metadata has to be applied to the item box after
 * it is rendered. vis recreates item DOM on redraw, hence callers re-run this
 * on the `changed` event.
 */
export function applyBackgroundDataAttributes(
	timeline: Timeline,
	attributesById: ReadonlyMap<string, Record<string, string>>,
): void {
	if (attributesById.size === 0) {
		return;
	}

	const items = (timeline as unknown as TimelineInternals).itemSet?.items;
	if (!items) {
		return;
	}

	for (const key of Object.keys(items)) {
		const item = items[key];
		if (item.data?.type !== 'background') {
			continue;
		}
		const box = item.dom?.box;
		const attributes = attributesById.get(String(item.id ?? key));
		if (!box || !attributes) {
			continue;
		}
		for (const [name, value] of Object.entries(attributes)) {
			box.setAttribute(`data-${name}`, value);
		}
	}
}

type TimelineInternals = {
	itemSet?: {
		items?: Record<string, BackgroundItemInternals>;
	};
};

type BackgroundItemInternals = {
	id?: string | number;
	data?: Record<string, unknown>;
	dom?: { box?: HTMLElement };
};
