import { BasesEntry, BasesViewConfig, Value, moment } from 'obsidian';
import { logger } from '../helper/logger';

/**
 * Minimal properties for the timeline view in obsidian file
 */
export class TimelineProperties {
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
	constructor(entry: BasesEntry, config: BasesViewConfig) {
		this.entry = entry;
		this.config = config;
	}

	isValid(): boolean {
		return !!this.start;
	}

	getContentForDraw(): string {
		return `${this.getDateDescription() || ''}<br><a href=${
			this.entry.file.path
		} class="internal-link">${this.content || ''}</a>`;
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
	): TimelineProperties {
		const properties = new TimelineProperties(entry, config);

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

	return entry.getValue('note.start') || entry.getValue('formula.start');
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
