import { App, BasesEntryGroup } from 'obsidian';
import { DataSet } from 'vis-data';
import { DataGroup, DataItem } from 'vis-timeline';
import { logger } from './logger';
import { TimelineProperties } from '../type';

export type ConvertToVisDataResult = {
	/** item info */
	items: DataSet<DataItem>;
	/** group info */
	groups: DataSet<DataGroup>;
};

/**
 * convert the grouped data to the vis data
 */
export function convertToVisData(
	groupedData: BasesEntryGroup[],
): ConvertToVisDataResult {
	const items = new DataSet<DataItem>();
	const groups = new DataSet<DataGroup>();

	for (const gd of groupedData) {
		const groupName = gd.key?.toString() || '';

		groups.add({
			id: getGroupName(groupName),
			content: groupName,
		});

		gd.entries.forEach((entry) => {
			const properties = TimelineProperties.fromEntry(entry);

			if (!properties.isValid()) {
				logger.warn(`skip invalid entry ${entry.file.basename}`);
				return;
			}

			const item: DataItem = {
				start: properties.start!,
				end: properties.end,
				content: properties.getContentForDraw(),
				group: getGroupName(groupName),
			};

			items.add(item);
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
