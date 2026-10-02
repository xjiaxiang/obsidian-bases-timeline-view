import { App, BasesEntry, BasesEntryGroup, BasesViewConfig } from 'obsidian';
import { logger } from './logger';
import { parseBasesEntry } from './parse-bases-entry';
import { resolveTimelineGroupId, normalizeGroupKey } from './timeline-group';
import { buildItemContentHtml } from './timeline-item-content';
import type {
	TimelineBackgroundInput,
	TimelineGroupInput,
	TimelineItemInput,
	TimelineMarkerInput,
	TimelineRenderInput,
} from '../type/timeline-render';

type TimelineRole = 'item' | 'background' | 'marker';

/**
 * Convert Bases grouped entries to generic timeline render input.
 * View options `markerWhen` / `backgroundWhen` classify entries (marker > background > item).
 * Groups are only emitted when Bases actually groupBy'd (non-empty group key).
 * Entries with an empty group key fall into `Other` when grouping is active.
 */
export function convertToVisData(
	groupedData: BasesEntryGroup[],
	config: BasesViewConfig,
	app: App,
): TimelineRenderInput {
	const items: TimelineItemInput[] = [];
	const backgrounds: TimelineBackgroundInput[] = [];
	const markers: TimelineMarkerInput[] = [];
	const groups: TimelineGroupInput[] = [];
	const groupIds = new Set<string>();

	const hasGrouping = groupedData.some(
		(gd) => !!normalizeGroupKey(gd.key?.toString()),
	);

	for (const gd of groupedData) {
		const groupId = resolveTimelineGroupId(
			gd.key?.toString(),
			hasGrouping,
		);
		if (groupId && !groupIds.has(groupId)) {
			groupIds.add(groupId);
			groups.push({
				id: groupId,
				content: groupId,
			});
		}

		gd.entries.forEach((entry) => {
			const parsed = parseBasesEntry(entry, config, app);
			const role = resolveRole(entry, config);

			if (role === 'marker') {
				if (!parsed.start) {
					logger.warn(`skip marker without start: ${entry.file.basename}`);
					return;
				}
				markers.push({
					id: entry.file.path,
					time: parsed.start,
					title: parsed.title,
				});
				return;
			}

			if (role === 'background') {
				if (!parsed.start || !parsed.end) {
					logger.warn(
						`skip background without start/end: ${entry.file.basename}`,
					);
					return;
				}
				backgrounds.push({
					id: entry.file.path,
					start: parsed.start,
					end: parsed.end,
					content: parsed.title,
					group: groupId,
					className: parsed.className,
				});
				return;
			}

			if (!parsed.start) {
				logger.warn(`skip invalid entry ${entry.file.basename}`);
				return;
			}

			items.push({
				id: entry.file.path,
				start: parsed.start,
				end: parsed.end,
				content: buildItemContentHtml({
					path: parsed.path,
					title: parsed.title,
					start: parsed.start,
					end: parsed.end,
					startLabel: parsed.startLabel,
					endLabel: parsed.endLabel,
					frontmatter: parsed.frontmatter,
					tags: parsed.tags,
				}),
				group: groupId,
				className: parsed.className,
			});
		});
	}

	return {
		items,
		backgrounds,
		markers,
		groups: groups.length > 0 ? groups : undefined,
	};
}

/**
 * Resolve draw role from view predicates. Priority: marker > background > item.
 */
function resolveRole(entry: BasesEntry, config: BasesViewConfig): TimelineRole {
	const markerProp = config.getAsPropertyId('markerWhen');
	if (markerProp && entry.getValue(markerProp)?.isTruthy()) {
		return 'marker';
	}

	const backgroundProp = config.getAsPropertyId('backgroundWhen');
	if (backgroundProp && entry.getValue(backgroundProp)?.isTruthy()) {
		return 'background';
	}

	return 'item';
}
