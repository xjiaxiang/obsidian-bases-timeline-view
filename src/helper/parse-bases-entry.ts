import {
	App,
	BasesEntry,
	BasesViewConfig,
	ListValue,
	Value,
	getAllTags,
} from 'obsidian';
import { normalizeVisDate } from './normalize-vis-date';

export type ParsedBasesEntry = {
	path: string;
	title: string;
	start?: string;
	end?: string;
	startLabel?: string;
	endLabel?: string;
	className?: string;
	frontmatter: Record<string, unknown>;
	tags: string[];
};

/**
 * Read Bases entry fields used by the timeline adapter (no HTML).
 */
export function parseBasesEntry(
	entry: BasesEntry,
	config: BasesViewConfig,
	app: App,
): ParsedBasesEntry {
	const { start, end } = getValidDate(
		getStartDate(entry, config),
		getEndDate(entry, config),
	);

	const content = getContent(entry, config);
	const title =
		!!content && content.isTruthy()
			? content.toString()
			: entry.file.basename;

	const cache = app.metadataCache.getFileCache(entry.file);
	const frontmatter = cache?.frontmatter ?? {};
	const tags = cache ? (getAllTags(cache) ?? []) : [];

	return {
		path: entry.file.path,
		title,
		start,
		end,
		startLabel: valueToOptionalString(getStartLabel(entry, config)) || start,
		endLabel: valueToOptionalString(getEndLabel(entry, config)) || end,
		className: getClassName(entry, config),
		frontmatter,
		tags,
	};
}

function getStartDate(entry: BasesEntry, config: BasesViewConfig) {
	const customStartField = config.getAsPropertyId('startField');
	if (customStartField) {
		return entry.getValue(customStartField);
	}

	return (
		entry.getValue('note.start') ||
		entry.getValue('formula.start') ||
		entry.getValue('note.date') ||
		entry.getValue('formula.date')
	);
}

function getEndDate(entry: BasesEntry, config: BasesViewConfig) {
	const customEndField = config.getAsPropertyId('endField');
	if (customEndField) {
		return entry.getValue(customEndField);
	}

	return entry.getValue('note.end') || entry.getValue('formula.end');
}

function getContent(entry: BasesEntry, config: BasesViewConfig) {
	const customContentField = config.getAsPropertyId('contentField');
	if (customContentField) {
		return entry.getValue(customContentField);
	}

	return entry.getValue('note.content') || entry.getValue('formula.content');
}

function getClassName(
	entry: BasesEntry,
	config: BasesViewConfig,
): string | undefined {
	const customField = config.getAsPropertyId('classNameField');
	const value = customField
		? entry.getValue(customField)
		: entry.getValue('note.cssclasses') ||
			entry.getValue('formula.cssclasses');

	return valueToClassName(value);
}

function valueToClassName(value: Value | null): string | undefined {
	if (!value || !value.isTruthy()) {
		return undefined;
	}

	if (value instanceof ListValue) {
		const parts: string[] = [];
		for (let i = 0; i < value.length(); i++) {
			const el = value.get(i);
			if (el?.isTruthy()) {
				const part = el.toString().trim();
				if (part) {
					parts.push(part);
				}
			}
		}
		return parts.length > 0 ? parts.join(' ') : undefined;
	}

	const text = value.toString().trim();
	return text || undefined;
}

function getStartLabel(entry: BasesEntry, config: BasesViewConfig) {
	const customStartLabelField = config.getAsPropertyId('startLabelField');
	if (customStartLabelField) {
		return entry.getValue(customStartLabelField);
	}

	return (
		entry.getValue('note.startLabel') || entry.getValue('formula.startLabel')
	);
}

function getEndLabel(entry: BasesEntry, config: BasesViewConfig) {
	const customEndLabelField = config.getAsPropertyId('endLabelField');
	if (customEndLabelField) {
		return entry.getValue(customEndLabelField);
	}

	return entry.getValue('note.endLabel') || entry.getValue('formula.endLabel');
}

function valueToOptionalString(value: Value | null): string | undefined {
	if (!value || !value.isTruthy()) {
		return undefined;
	}
	return value.toString();
}

function getValidDate(start: Value | null, end?: Value | null) {
	if (!start || !start.isTruthy()) {
		return {
			start: undefined,
			end: undefined,
		};
	}

	const normalizedStart = normalizeVisDate(start.toString());
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

	const normalizedEnd = normalizeVisDate(end.toString());
	if (!normalizedEnd) {
		return {
			start: normalizedStart,
			end: undefined,
		};
	}

	const [sortedStart, sortedEnd] = [normalizedStart, normalizedEnd].sort();
	return {
		start: sortedStart,
		end: sortedEnd,
	};
}
