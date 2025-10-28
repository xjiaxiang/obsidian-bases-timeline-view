import type { DataItem, TimelineOptions } from 'vis-timeline/esnext';
import { Timeline } from 'vis-timeline/esnext';
import { BasesEntryGroup } from 'obsidian';
import { convertToVisData } from './convert-to-vis-data';

import 'vis-timeline/styles/vis-timeline-graph2d.css';
/**
 * draw the vis timeline
 */
export function drawVisTimeline(
	containerEl: HTMLElement,
	data: BasesEntryGroup[],
	options: TimelineOptions = {},
) {
	const { items, groups } = convertToVisData(data);

	const timeline = new Timeline(containerEl, items, groups, {
		showCurrentTime: false,
		showTooltips: false,
		...options,
		template: function (item: DataItem, _element: HTMLElement) {
			const eventContainer = document.createElement('div');

			if (item.content) {
				const parsed = new DOMParser().parseFromString(
					item.content,
					'text/html',
				);
				eventContainer.append(...Array.from(parsed.body.childNodes));
			}

			return eventContainer;
		},
	});
	return timeline;
}
