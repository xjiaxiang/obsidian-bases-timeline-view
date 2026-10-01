import { Plugin, QueryController } from 'obsidian';
import type { TimelineOptions } from 'vis-timeline/esnext';
import {
	renderFromDataview,
	type DataviewRenderSources,
} from './api/dataview';
import { drawVisTimeline } from './helper/draw-vis-timeline';
import { reattachTimelineLinkHandlers } from './helper/timeline-link-handlers';
import type { TimelineRenderInput } from './type/timeline-render';
import { TimelineView } from './ui/timeline-view';

import './timeline.css';

export default class BasesTimelineViewPlugin extends Plugin {
	onload() {
		this.registerView();

		this.registerHoverLinkSource('bases-timeline-view', {
			display: 'Bases Timeline View',
			defaultMod: true, // 与 Obsidian 设置一致：是否需要 Cmd/Ctrl
		});
	}

	onunload() {}

	registerView() {
		this.registerBasesView(TimelineView.type, {
			name: 'Timeline',
			icon: 'lucide-chart-no-axes-gantt',
			factory: (controller: QueryController, parentEl: HTMLElement) => {
				return new TimelineView(controller, parentEl);
			},
			options: () => [
				{
					key: 'startField',
					type: 'property',
					displayName: 'start field',
					default: 'note.start',
				},
				{
					key: 'endField',
					type: 'property',
					displayName: 'end field',
					default: 'note.end',
				},
				{
					key: 'contentField',
					type: 'property',
					displayName: 'content field',
					default: 'note.content',
				},
				{
					key: 'startLabelField',
					type: 'property',
					displayName: 'start label field',
					default: 'note.startLabel',
				},
				{
					key: 'endLabelField',
					type: 'property',
					displayName: 'end label field',
					default: 'note.endLabel',
				},
				{
					key: 'classNameField',
					type: 'property',
					displayName: 'class name field',
					default: 'note.cssclasses',
				},
				{
					key: 'backgroundWhen',
					type: 'property',
					displayName: 'background when',
				},
				{
					key: 'markerWhen',
					type: 'property',
					displayName: 'marker when',
				},
			],
		});
	}

	api = {
		render: (
			containerEl: HTMLElement,
			input: TimelineRenderInput,
			options?: TimelineOptions,
		) => {
			reattachTimelineLinkHandlers(containerEl, this.app, this);
			return drawVisTimeline(containerEl, input, options);
		},
		/** DataviewJS helpers: pass page lists instead of mapping by hand */
		dv: {
			render: (containerEl: HTMLElement, sources: DataviewRenderSources) =>
				renderFromDataview(containerEl, sources, {
					app: this.app,
					hoverParent: this,
				}),
		},
	};
}
