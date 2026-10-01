import { App, BasesEntryGroup, BasesViewConfig } from 'obsidian';
import { logger } from './logger';
import { TimelineProperties } from '../type';
import type {
	TimelineGroupInput,
	TimelineItemInput,
	TimelineRenderInput,
} from '../type/timeline-render';

/**
 * Convert Bases grouped entries to generic timeline render input.
 */
export function convertToVisData(
	groupedData: BasesEntryGroup[],
	config: BasesViewConfig,
	app: App,
): TimelineRenderInput {
	const items: TimelineItemInput[] = [];
	const groups: TimelineGroupInput[] = [];

	for (const gd of groupedData) {
		const groupName = gd.key?.toString() || '';
		const groupId = getGroupName(groupName);

		groups.push({
			id: groupId,
			content: groupName,
		});

		gd.entries.forEach((entry) => {
			const properties = TimelineProperties.fromEntry(entry, config, app);

			if (!properties.isValid()) {
				logger.warn(`skip invalid entry ${entry.file.basename}`);
				return;
			}

			items.push({
				id: entry.file.path,
				start: properties.start!,
				end: properties.end,
				content: properties.getContentForDraw(),
				group: groupId,
			});
		});
	}

	return {
		items,
		groups,
	};
}

function getGroupName(groupName?: string) {
	return groupName || 'default_id';
}
