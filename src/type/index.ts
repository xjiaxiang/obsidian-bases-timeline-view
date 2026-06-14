import {
	App,
	BasesEntry,
	BasesViewConfig,
	Value,
	getAllTags,
	moment,
} from 'obsidian';
import { logger } from '../helper/logger';

/**
 * Minimal properties for the timeline view in obsidian file
 */
export class TimelineProperties {
	private app: App;
	/**
	 * the start key of file properties, if start is not set, it means the instance is not valid
	 * @example start: '2025-01-01'
	 */
	public start?: string;
	/**
	 * the end key of file properties，if not set, it means the end date is the same as the start date
	 * @example end: '2025-01-01'
	 */
	public end?: string;

	/**
	 * the content key of file properties, if not set, it means the title is the same as the file name
	 * @example content: 'title of the item'
	 */
	public content?: string;

	private config: BasesViewConfig;
	private entry: BasesEntry;
	constructor(entry: BasesEntry, config: BasesViewConfig, app: App) {
		this.entry = entry;
		this.config = config;
		this.app = app;
	}

	isValid(): boolean {
		return !!this.start;
	}

	getContentForDraw(): string {
		const path = this.entry.file.path;
		// HTML escape special characters in the path
		// This ensures paths with spaces and special characters are handled correctly
		const escapedPath = escapeHtml(path);

		const cache = this.app.metadataCache.getFileCache(this.entry.file);
		const frontmatter = cache?.frontmatter ?? {};
		const tags = cache ? (getAllTags(cache) ?? []) : [];
		const dataAttrs = buildItemDataAttributes(frontmatter, tags);

		return `<div ${dataAttrs}>${this.getDateDescription() || ''}<br><a href="${escapedPath}" class="internal-link" data-href="${escapedPath}">${escapeHtml(this.content || '')}</a></div>`;
	}

	private getDateDescription() {
		if (!this.isValid()) {
			return '';
		}

		const startLabel = this.getStartForDisplay();
		const endLabel = this.getEndForDisplay();

		if (endLabel) {
			return `${startLabel} - ${endLabel}`;
		}
		return startLabel;
	}

	getStartForDisplay(): string {
		const display = getStartLabel(this.entry, this.config);
		if (display && display.isTruthy()) {
			return display.toString();
		}

		return this.start || '';
	}

	getEndForDisplay() {
		const display = getEndLabel(this.entry, this.config);
		if (display && display.isTruthy()) {
			return display.toString();
		}

		return this.end;
	}

	/**
	 * create the timeline properties from the entry
	 */
	static fromEntry(
		entry: BasesEntry,
		config: BasesViewConfig,
		app: App,
	): TimelineProperties {
		const properties = new TimelineProperties(entry, config, app);

		const { start, end } = getValidDate(
			getStartDate(entry, config),
			getEndDate(entry, config),
		);

		properties.start = start;
		properties.end = end;

		const content = getContent(entry, config);
		properties.content =
			!!content && content.isTruthy()
				? content.toString()
				: entry.file.basename;

		return properties;
	}
}

function getStartDate(entry: BasesEntry, config: BasesViewConfig) {
	const customeStartField = config.getAsPropertyId('startField');
	if (customeStartField) {
		return entry.getValue(customeStartField);
	}

	return (
		entry.getValue('note.start') ||
		entry.getValue('formula.start') ||
		// 支持 date 字段
		entry.getValue('note.date') ||
		entry.getValue('formula.date')
	);
}

function getEndDate(entry: BasesEntry, config: BasesViewConfig) {
	const customeEndField = config.getAsPropertyId('endField');
	if (customeEndField) {
		return entry.getValue(customeEndField);
	}

	return entry.getValue('note.end') || entry.getValue('formula.end');
}

function getContent(entry: BasesEntry, config: BasesViewConfig) {
	const customeContentField = config.getAsPropertyId('contentField');
	if (customeContentField) {
		return entry.getValue(customeContentField);
	}

	return entry.getValue('note.content') || entry.getValue('formula.content');
}

function getStartLabel(entry: BasesEntry, config: BasesViewConfig) {
	const customeStartLabelField = config.getAsPropertyId('startLabelField');
	if (customeStartLabelField) {
		return entry.getValue(customeStartLabelField);
	}

	return (
		entry.getValue('note.startLabel') || entry.getValue('formula.startLabel')
	);
}

function getEndLabel(entry: BasesEntry, config: BasesViewConfig) {
	const customeEndLabelField = config.getAsPropertyId('endLabelField');
	if (customeEndLabelField) {
		return entry.getValue(customeEndLabelField);
	}

	return entry.getValue('note.endLabel') || entry.getValue('formula.endLabel');
}

function getValidDate(start: Value | null, end?: Value | null) {
	if (!start || !start.isTruthy()) {
		return {
			start: undefined,
			end: undefined,
		};
	}

	const normalizedStart = normalizeDate(start.toString());
	if (!normalizedStart) {
		return {
			start: undefined,
			end: undefined,
		};
	}

	if (!end || !end.isTruthy()) {
		return {
			start: normalizedStart,
		};
	}

	const normalizedEnd = normalizeDate(end.toString());
	if (!normalizedEnd) {
		return {
			start: normalizedStart,
			end: undefined,
		};
	}

	const [sortedStart, sortedEnd] = sortDates([normalizedStart, normalizedEnd]);
	return {
		start: sortedStart,
		end: sortedEnd,
	};
}

function normalizeDate(date: string): string | undefined {
	const normalized = moment(date);
	if (normalized.isValid()) {
		return normalized.format('YYYY-MM-DD');
	}

	logger.warn(`invalid date: ${date}`);
	return undefined;
}

function sortDates(dates: string[]): string[] {
	return dates.sort();
}

/**
 * Escape HTML special characters in a string
 * This ensures strings with special characters are safely used in HTML attributes
 * @param text - The text to escape
 * @returns The escaped text with HTML entities
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Build data attributes for timeline item DOM (tags + frontmatter).
 * - data-tags: space-separated tag list, CSS e.g. [data-tags~="foo"]
 * - data-{key}: each frontmatter field, e.g. data-status="done", data-a="1"
 */
function buildItemDataAttributes(
	frontmatter: Record<string, unknown>,
	tags: string[],
): string {
	const attrs = ['class="timeline-item"'];

	if (tags.length > 0) {
		attrs.push(`data-tags="${escapeHtml(tags.join(' '))}"`);
	}

	for (const [key, value] of Object.entries(frontmatter)) {
		if (value == null) {
			continue;
		}
		const attrKey = sanitizeDataAttributeKey(key);
		if (!attrKey) {
			continue;
		}
		const attrValue = serializeFrontmatterValue(value);
		if (attrValue === undefined) {
			continue;
		}
		attrs.push(`data-${attrKey}="${escapeHtml(attrValue)}"`);
	}

	return attrs.join(' ');
}

function serializeFrontmatterValue(value: unknown): string | undefined {
	if (value == null) {
		return undefined;
	}
	if (Array.isArray(value)) {
		return value.map(String).join(' ');
	}
	if (typeof value === 'object') {
		return JSON.stringify(value);
	}
	return String(value);
}

function sanitizeDataAttributeKey(key: string): string {
	return key
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}
