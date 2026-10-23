import { describe, expect, it, vi } from 'vitest';
import type { App, BasesEntryGroup, BasesViewConfig } from 'obsidian';
import { convertToVisData } from '../src/helper/convert-to-vis-data';
import { logger } from '../src/helper/logger';

function value(text: string) {
	return {
		isTruthy: () => true,
		toString: () => text,
	};
}

function makeEntry(path: string, values: Record<string, string>) {
	const mapped = Object.fromEntries(
		Object.entries(values).map(([key, text]) => [key, value(text)]),
	);
	return {
		file: { path, basename: path.replace(/\.md$/, '') },
		getValue: (key: string) => mapped[key] ?? null,
	};
}

function makeConfig(options: Record<string, string>): BasesViewConfig {
	return {
		getAsPropertyId: (key: string) => options[key] ?? null,
	} as unknown as BasesViewConfig;
}

const app = {
	metadataCache: {
		getFileCache: () => null,
	},
} as unknown as App;

function render(entryValues: Record<string, string>, options: Record<string, string>) {
	const groupedData = [
		{
			key: undefined,
			entries: [makeEntry('a.md', entryValues)],
		},
	] as unknown as BasesEntryGroup[];

	return convertToVisData(groupedData, makeConfig(options), app);
}

describe('convertToVisData item type', () => {
	it('maps the item type field to the vis item type', () => {
		const input = render(
			{ 'note.start': '2020-01-01', 'note.itemType': 'point' },
			{ itemTypeField: 'note.itemType' },
		);

		expect(input.items?.[0]?.type).toBe('point');
	});

	it('requires an exact match', () => {
		const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
		const input = render(
			{ 'note.start': '2020-01-01', 'note.itemType': 'Point' },
			{ itemTypeField: 'note.itemType' },
		);

		expect(input.items?.[0]?.type).toBeUndefined();
		expect(warn).toHaveBeenCalled();
		warn.mockRestore();
	});

	it('does not read a type property unless itemTypeField is set', () => {
		const input = render(
			{ 'note.start': '2020-01-01', 'note.itemType': 'point' },
			{},
		);

		expect(input.items?.[0]?.type).toBeUndefined();
	});

	it('passes end through but omits it from point content', () => {
		const input = render(
			{
				'note.start': '2020-01-01',
				'note.end': '2020-02-01',
				'note.endLabel': 'Feb',
				'note.itemType': 'point',
			},
			{ itemTypeField: 'note.itemType' },
		);

		const item = input.items?.[0];
		expect(item?.end).toBe('2020-02-01');
		expect(item?.content).toContain('2020-01-01');
		expect(item?.content).not.toContain('Feb');
		expect(item?.content).not.toContain('2020-02-01');
	});
});
