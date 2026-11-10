import type { DataItem, TimelineOptions } from 'vis-timeline/esnext';
import { Timeline } from 'vis-timeline/esnext';
import { DataSet } from 'vis-data';
import { parseTimelineDate } from './normalize-vis-date';
import { applyBackgroundDataAttributes } from './timeline-background-attributes';
import type {
	TimelineGroupInput,
	TimelineRenderInput,
} from '../type/timeline-render';

import 'vis-timeline/styles/vis-timeline-graph2d.css';

/**
 * Draw a vis timeline from generic render input (Bases / DataviewJS / API).
 *
 * @note vis can only put background `data-*` attributes on the content
 * element, so `background.dataAttributes` is applied to the rendered
 * `.vis-item` box here.
 */
export function drawVisTimeline(
	containerEl: HTMLElement,
	input: TimelineRenderInput,
	options: TimelineOptions = {},
): Timeline {


	const items = new DataSet<DataItem>();
	const groups = buildGroups(input);

	for (const item of input.items ?? []) {
		const start = parseTimelineDate(item.start);
		const end = item.end == null ? undefined : parseTimelineDate(item.end);
		if (!start || (item.end != null && !end)) continue;
		items.add({
			id: item.id,
			start,
			end,
			content: item.content,
			type: item.type,
			group: item.group,
			className: item.className,
			title: item.title,
		});
	}

	const backgroundAttributes = new Map<string, Record<string, string>>();
	for (const bg of input.backgrounds ?? []) {
		const start = parseTimelineDate(bg.start);
		const end = parseTimelineDate(bg.end);
		if (!start || !end) continue;
		const id = items.add({
			id: bg.id,
			start,
			end,
			content: bg.content ?? '',
			group: bg.group,
			className: bg.className,
			style: bg.style,
			type: 'background',
		});
		if (bg.dataAttributes) {
			backgroundAttributes.set(String(id), bg.dataAttributes);
		}
	}

	const timelineOptions: TimelineOptions = {
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

				// eventContainer.querySelectorAll('a.internal-link').forEach((link) => {
				// 	link.addEventListener('mousedown', (e) => e.stopPropagation());
				// });
			}

			return eventContainer;
		},
	};

	// Empty groups DataSet still enables group mode and can cause
	// "WARNING: infinite loop in redraw?" / missing items — omit it.
	const timeline =
		groups != null
			? new Timeline(containerEl, items, groups, timelineOptions)
			: new Timeline(containerEl, items, timelineOptions);

	// vis writes item dataAttributes to the content element only; backgrounds
	// need theirs on `.vis-item.vis-background`, which is rebuilt on redraw.
	if (backgroundAttributes.size > 0) {
		const decorate = () =>
			applyBackgroundDataAttributes(timeline, backgroundAttributes);
		timeline.on('changed', decorate);
		decorate();
	}

	for (const marker of input.markers ?? []) {
		const time = parseTimelineDate(marker.time);
		if (!time) continue;
		const id = timeline.addCustomTime(time, marker.id);
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

	// if no groups are provided, collect from items / backgrounds that set group
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

	if (byId.size === 0) {
		return null;
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
