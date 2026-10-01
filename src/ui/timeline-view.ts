import { BasesView, QueryController } from 'obsidian';
import { convertToVisData } from '../helper/convert-to-vis-data';
import { drawVisTimeline } from '../helper/draw-vis-timeline';
import { attachTimelineLinkHandlers } from '../helper/timeline-link-handlers';

/**
 * Timeline view for obsidian bases
 */
export class TimelineView extends BasesView {
	static readonly type = 'timeline-view';

	readonly type = 'timeline-view';
	private containerEl: HTMLElement;

	constructor(controller: QueryController, parentEl: HTMLElement) {
		super(controller);
		this.containerEl = parentEl.createDiv('bases-timeline-view-container');

		const detach = attachTimelineLinkHandlers(
			this.containerEl,
			this.app,
			this,
		);
		this.register(detach);
	}

	public onDataUpdated(): void {
		this.containerEl.empty();

		const input = convertToVisData(
			this.data.groupedData,
			this.config,
			this.app,
		);
		drawVisTimeline(this.containerEl, input);
	}
}
