import { App, BasesEntry, Value, moment } from 'obsidian';
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

	private entry: BasesEntry;
	constructor(entry: BasesEntry) {
		this.entry = entry;
	}

	isValid(): boolean {
		return !!this.start;
	}

	getContentForDraw(): string {
		const container = document.createElement('div');

		const dateDescription = document.createElement('span');
		dateDescription.textContent = this.getDateDescription() || '';
		container.appendChild(dateDescription);

		container.appendChild(document.createElement('br'));

		const a = document.createElement('a');
		a.className = 'internal-link';
		a.href = this.entry.file.path;
		a.textContent = this.content || '';
		container.appendChild(a);

		return container.outerHTML;
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
		const display =
			this.entry.getValue('note.startLabel') ||
			this.entry.getValue('formula.startLabel');
		if (display && display.isTruthy()) {
			return display.toString();
		}

		return this.start || '';
	}

	getEndForDisplay() {
		const display =
			this.entry.getValue('note.endLabel') ||
			this.entry.getValue('formula.endLabel');
		if (display && display.isTruthy()) {
			return display.toString();
		}

		return this.end;
	}

	/**
	 * create the timeline properties from the entry
	 */
	static fromEntry(entry: BasesEntry): TimelineProperties {
		const properties = new TimelineProperties(entry);

		const { start, end } = getValidDate(
			entry.getValue('note.start') || entry.getValue('formula.start'),
			entry.getValue('note.end') || entry.getValue('formula.end'),
		);

		properties.start = start;
		properties.end = end;

		const content =
			entry.getValue('note.content') || entry.getValue('formula.content');
		properties.content =
			!!content && content.isTruthy()
				? content.toString()
				: entry.file.basename;

		return properties;
	}
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
