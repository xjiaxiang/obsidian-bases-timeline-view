import type { DataItem, TimelineOptions } from 'vis-timeline/esnext';
import { Timeline } from 'vis-timeline/esnext';
import { DataSet } from 'vis-data';
import type {
	TimelineGroupInput,
	TimelineRenderInput,
} from '../type/timeline-render';

import 'vis-timeline/styles/vis-timeline-graph2d.css';

/**
 * Draw a vis timeline from generic render input (Bases / DataviewJS / API).
 */
export function drawVisTimeline(
	containerEl: HTMLElement,
	input: TimelineRenderInput,
	options: TimelineOptions = {},
): Timeline {
	const items = new DataSet<DataItem>();
	const groups = buildGroups(input);

	for (const item of input.items ?? []) {
		items.add({
			id: item.id,
			start: item.start,
			end: item.end,
			content: item.content,
			group: item.group,
			className: item.className,
			title: item.title,
		});
	}

	for (const bg of input.backgrounds ?? []) {
		items.add({
			id: bg.id,
			start: bg.start,
			end: bg.end,
			content: bg.content ?? '',
			group: bg.group,
			className: bg.className,
			style: bg.style,
			type: 'background',
		});
	}

	const timeline = new Timeline(containerEl, items, groups, {
		showCurrentTime: false,
		showTooltips: false,
		selectable: false,
		...options,
		template: function (item: DataItem, _element: HTMLElement) {
			if (item.type === 'background') {
				return item.content || '';
			}

			const eventContainer = document.createElement('div');

			if (item.content) {
				const parsed = new DOMParser().parseFromString(
					item.content,
					'text/html',
				);
				eventContainer.append(...Array.from(parsed.body.childNodes));

				eventContainer.querySelectorAll('a.internal-link').forEach((link) => {
					link.addEventListener('mousedown', (e) => e.stopPropagation());
				});
			}

			return eventContainer;
		},
	});

	for (const marker of input.markers ?? []) {
		const id = timeline.addCustomTime(marker.time, marker.id);
		if (marker.title) {
			// Timeline typings omit setCustomTimeMarker; runtime supports it.
			(
				timeline as Timeline & {
					setCustomTimeMarker: (
						title: string,
						id?: string | number,
						editable?: boolean,
					) => void;
				}
			).setCustomTimeMarker(marker.title, id);
		}
	}

	return timeline;
}

function buildGroups(input: TimelineRenderInput) {
	const provided = input.groups ?? [];
	const byId = new Map<string, TimelineGroupInput>();

	for (const group of provided) {
		if (group.id) {
			byId.set(String(group.id), group);
		}
	}

	// if no groups are provided, we need to create them from the items and backgrounds
	if (provided.length === 0) {
		for (const item of input.items ?? []) {
			if (item.group == null || item.group === '') {
				continue;
			}
			const id = String(item.group);
			if (!byId.has(id)) {
				byId.set(id, { id, content: id });
			}
		}
		for (const bg of input.backgrounds ?? []) {
			if (bg.group == null || bg.group === '') {
				continue;
			}
			const id = String(bg.group);
			if (!byId.has(id)) {
				byId.set(id, { id, content: id });
			}
		}
	}

	return new DataSet(
		[...byId.values()].map((g) => ({
			id: g.id,
			content: g.content,
			className: g.className,
			order: g.order,
		})),
	);
}
