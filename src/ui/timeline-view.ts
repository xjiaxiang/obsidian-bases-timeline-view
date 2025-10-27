import { BasesView, QueryController } from 'obsidian';
import { drawVisTimeline } from '../helper/draw-vis-timeline';

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
	}

	public onDataUpdated(): void {
		this.containerEl.empty();

		// render
		drawVisTimeline(this.containerEl, this.data.groupedData);
	}
}
