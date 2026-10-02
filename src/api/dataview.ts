import type { App } from 'obsidian';
import { getAllTags, TFile } from 'obsidian';
import type { TimelineOptions } from 'vis-timeline/esnext';
import { drawVisTimeline } from '../helper/draw-vis-timeline';
import { logger } from '../helper/logger';
import { normalizeVisDate } from '../helper/normalize-vis-date';
import { resolveTimelineGroupId, normalizeGroupKey } from '../helper/timeline-group';
import { reattachTimelineLinkHandlers } from '../helper/timeline-link-handlers';
import { buildItemContentHtml } from '../helper/timeline-item-content';
import type {
	TimelineBackgroundInput,
	TimelineDate,
	TimelineItemInput,
	TimelineMarkerInput,
	TimelineRenderInput,
} from '../type/timeline-render';

/** Loose page / DataArray element from Dataview (no hard dependency). */
export type DataviewPageLike = Record<string, unknown> & {
	file?: {
		path?: string;
		name?: string;
	};
	/**
	 * Manual swimlane id. When present on the object (own property),
	 * overrides {@link DataviewFieldMap.group}.
	 */
	group?: unknown;
};

export type DataviewMarkerLiteral = {
	time: TimelineDate;
	title?: string;
	id?: string;
};

export type DataviewFieldMap = {
	/** default: start, then date */
	start?: string;
	/** default: end */
	end?: string;
	/** default: content, then file.name */
	content?: string;
	/** default: cssclasses */
	className?: string;
	/**
	 * Page property used as swimlane id when the element does not set `group`.
	 * Element-level `group` always wins.
	 */
	group?: string;
	/** optional display label for start (falls back to normalized start) */
	startLabel?: string;
	/** optional display label for end (falls back to normalized end) */
	endLabel?: string;
};

export type DataviewRenderSources = {
	items?: Iterable<DataviewPageLike> | DataviewPageLike[];
	backgrounds?: Iterable<DataviewPageLike> | DataviewPageLike[];
	/** Pages (use start as time) or plain marker literals */
	markers?:
		| Iterable<DataviewPageLike | DataviewMarkerLiteral>
		| Array<DataviewPageLike | DataviewMarkerLiteral>;
	fields?: DataviewFieldMap;
	options?: TimelineOptions;
};

export type DataviewRenderContext = {
	app: App;
	hoverParent: unknown;
};

type MappedPageFields = {
	id?: string;
	start?: string;
	end?: string;
	content: string;
	className?: string;
	group?: string;
	startLabel?: string;
	endLabel?: string;
};

/**
 * Map Dataview page lists into TimelineRenderInput and draw.
 */
export function renderFromDataview(
	containerEl: HTMLElement,
	sources: DataviewRenderSources,
	ctx?: DataviewRenderContext,
) {
	const input = pagesToRenderInput(sources, ctx?.app);
	if (ctx) {
		reattachTimelineLinkHandlers(containerEl, ctx.app, ctx.hoverParent);
	}
	return drawVisTimeline(containerEl, input, sources.options);
}

export function pagesToRenderInput(
	sources: DataviewRenderSources,
	app?: App,
): TimelineRenderInput {
	const fields = normalizeFields(sources.fields);
	const items: TimelineItemInput[] = [];
	const backgrounds: TimelineBackgroundInput[] = [];
	const markers: TimelineMarkerInput[] = [];
	const groupIds = new Set<string>();

	const mappedItems: MappedPageFields[] = [];
	for (const page of toArray(sources.items)) {
		const mapped = mapPageFields(page, fields);
		if (mapped.start == null) {
			logger.warn(`dv: skip item without start: ${mapped.id ?? '?'}`);
			continue;
		}
		mappedItems.push(mapped);
	}

	const mappedBackgrounds: MappedPageFields[] = [];
	for (const page of toArray(sources.backgrounds)) {
		const mapped = mapPageFields(page, fields);
		if (mapped.start == null || mapped.end == null) {
			logger.warn(
				`dv: skip background without start/end: ${mapped.id ?? '?'}`,
			);
			continue;
		}
		mappedBackgrounds.push(mapped);
	}

	// Grouping is active when any item/background already resolved a group
	// (manual override or fields.group). Missing values then fall into `Other`.
	const hasGrouping = [...mappedItems, ...mappedBackgrounds].some(
		(mapped) => !!normalizeGroupKey(mapped.group),
	);

	for (const mapped of mappedItems) {
		const group = resolveTimelineGroupId(mapped.group, hasGrouping);
		if (group) {
			groupIds.add(group);
		}

		const { frontmatter, tags } = readMetaFromApp(app, mapped.id);
		items.push({
			id: mapped.id,
			start: mapped.start!,
			end: mapped.end,
			content: buildItemContentHtml({
				path: mapped.id || mapped.content,
				title: mapped.content,
				start: mapped.start,
				end: mapped.end,
				startLabel: mapped.startLabel,
				endLabel: mapped.endLabel,
				frontmatter,
				tags,
			}),
			group,
			className: mapped.className,
		});
	}

	for (const mapped of mappedBackgrounds) {
		const group = resolveTimelineGroupId(mapped.group, hasGrouping);
		if (group) {
			groupIds.add(group);
		}
		backgrounds.push({
			id: mapped.id,
			start: mapped.start!,
			end: mapped.end!,
			content: mapped.content,
			group,
			className: mapped.className,
		});
	}

	for (const entry of toArray(sources.markers)) {
		if (isMarkerLiteral(entry)) {
			const time = normalizeVisDate(entry.time);
			if (time == null) {
				logger.warn(`dv: skip marker without valid time: ${entry.id ?? '?'}`);
				continue;
			}
			markers.push({
				id: entry.id,
				time,
				title: entry.title,
			});
			continue;
		}
		const mapped = mapPageFields(entry, fields);
		if (mapped.start == null) {
			logger.warn(`dv: skip marker without start: ${mapped.id ?? '?'}`);
			continue;
		}
		markers.push({
			id: mapped.id,
			time: mapped.start,
			title: mapped.content,
		});
	}

	const groups =
		groupIds.size > 0
			? [...groupIds].map((id) => ({ id, content: id }))
			: undefined;

	return { items, backgrounds, markers, groups };
}

function normalizeFields(fields?: DataviewFieldMap): DataviewFieldMap {
	return {
		start: fields?.start,
		end: fields?.end ?? 'end',
		content: fields?.content ?? 'content',
		className: fields?.className ?? 'cssclasses',
		group: fields?.group,
		startLabel: fields?.startLabel,
		endLabel: fields?.endLabel,
	};
}

function mapPageFields(page: DataviewPageLike, fields: DataviewFieldMap) {
	const id = page.file?.path;
	const start = fields.start
		? readDate(page, fields.start)
		: (readDate(page, 'start') ?? readDate(page, 'date'));
	const end = readDate(page, fields.end ?? 'end');
	const content =
		readString(page, fields.content ?? 'content') ||
		page.file?.name ||
		id ||
		'';
	const className = readClassName(page, fields.className ?? 'cssclasses');
	const group = resolvePageGroup(page, fields);
	const startLabel = fields.startLabel
		? readString(page, fields.startLabel)
		: undefined;
	const endLabel = fields.endLabel
		? readString(page, fields.endLabel)
		: undefined;

	return {
		id,
		start,
		end,
		content,
		className,
		group,
		startLabel: startLabel || start,
		endLabel: endLabel || end,
	};
}

/**
 * Prefer element-level `group` (manual override) over `fields.group` property lookup.
 */
function resolvePageGroup(
	page: DataviewPageLike,
	fields: DataviewFieldMap,
): string | undefined {
	if (Object.prototype.hasOwnProperty.call(page, 'group')) {
		return normalizeGroupKey(stringifyGroupValue(page.group));
	}
	if (fields.group) {
		return normalizeGroupKey(readString(page, fields.group));
	}
	return undefined;
}

function stringifyGroupValue(raw: unknown): string | undefined {
	if (raw == null || raw === '') {
		return undefined;
	}
	if (Array.isArray(raw)) {
		const text = raw.map(String).join(' ').trim();
		return text || undefined;
	}
	const text = String(raw).trim();
	return text || undefined;
}

function readMetaFromApp(
	app: App | undefined,
	path: string | undefined,
): { frontmatter: Record<string, unknown>; tags: string[] } {
	if (!app || !path) {
		return { frontmatter: {}, tags: [] };
	}
	const file = app.vault.getAbstractFileByPath(path);
	if (!(file instanceof TFile)) {
		return { frontmatter: {}, tags: [] };
	}
	const cache = app.metadataCache.getFileCache(file);
	return {
		frontmatter: cache?.frontmatter ?? {},
		tags: cache ? (getAllTags(cache) ?? []) : [],
	};
}

function readDate(
	page: DataviewPageLike,
	key?: string,
): string | undefined {
	if (!key) {
		return undefined;
	}
	return normalizeVisDate(page[key]);
}

function readString(page: DataviewPageLike, key: string): string | undefined {
	const raw = page[key];
	if (raw == null || raw === '') {
		return undefined;
	}
	if (Array.isArray(raw)) {
		return raw.map(String).join(' ');
	}
	return String(raw);
}

function readClassName(
	page: DataviewPageLike,
	key: string,
): string | undefined {
	const raw = page[key];
	if (raw == null || raw === '') {
		return undefined;
	}
	if (Array.isArray(raw)) {
		const parts = raw.map(String).map((s) => s.trim()).filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : undefined;
	}
	const text = String(raw).trim();
	return text || undefined;
}

function isMarkerLiteral(
	value: DataviewPageLike | DataviewMarkerLiteral,
): value is DataviewMarkerLiteral {
	return (
		value != null &&
		typeof value === 'object' &&
		'time' in value &&
		(value as DataviewMarkerLiteral).time != null &&
		!('file' in value)
	);
}

function toArray<T>(value?: Iterable<T> | T[]): T[] {
	if (value == null) {
		return [];
	}
	return Array.isArray(value) ? value : [...value];
}
