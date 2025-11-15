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

		// Handle click events on internal-link elements
		this.registerDomEvent(this.containerEl, 'click', (e) => {
			const target = e.target as HTMLElement;
			const link = target.closest('a.internal-link') as HTMLAnchorElement;
			const href = link?.getAttribute('href');

			if (link && href) {
				e.stopPropagation();
				e.preventDefault();

				// Remove quotes if present (from JSON.stringify)
				// JSON.stringify adds quotes, so we need to remove them
				// const filepath = href.replace(/^["']|["']$/g, '');
				const filepath = href;
				this.app.workspace.openLinkText(filepath, '', 'tab');
			}
		});
	}

	public onDataUpdated(): void {
		this.containerEl.empty();

		// render
		drawVisTimeline(
			this.containerEl,
			this.data.groupedData,
			this.config,
			this.app,
		);
	}
}
