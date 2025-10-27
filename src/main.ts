import { Plugin, QueryController } from 'obsidian';
import { TimelineView } from './ui/timeline-view';

import './timeline.css';

export default class BasesTimelineViewPlugin extends Plugin {
	async onload() {
		this.registerView();
	}

	onunload() {}

	registerView() {
		this.registerBasesView(TimelineView.type, {
			name: 'Timeline',
			icon: 'lucide-chart-no-axes-gantt',
			factory: (controller: QueryController, parentEl: HTMLElement) => {
				return new TimelineView(controller, parentEl);
			},
		});
	}

	api = {
		// define your API methods here
	};
}
