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

describe('convertToVisData content HTML', () => {
	it('builds escaped HTML for group labels', () => {
		const groupedData = [
			{
				key: { toString: () => 'A <B>' },
				entries: [
					makeEntry('a.md', { 'note.start': '2020-01-01' }),
				],
			},
		] as unknown as BasesEntryGroup[];

		const input = convertToVisData(groupedData, makeConfig({}), app);

		expect(input.groups).toEqual([
			{
				id: 'A <B>',
				content: '<div class="timeline-group">A &lt;B&gt;</div>',
			},
		]);
	});

	it('builds escaped HTML for background labels', () => {
		const groupedData = [
			{
				key: undefined,
				entries: [
					makeEntry('bg.md', {
						'note.start': '2020-01-01',
						'note.end': '2020-02-01',
						'note.content': 'Q1 & Q2',
						'note.isBackground': 'true',
					}),
				],
			},
		] as unknown as BasesEntryGroup[];

		const input = convertToVisData(
			groupedData,
			makeConfig({ backgroundWhen: 'note.isBackground' }),
			app,
		);

		expect(input.backgrounds?.[0]?.content).toBe('Q1 &amp; Q2');
		expect(input.backgrounds?.[0]?.className).toBe(
			'timeline-background timeline-background-odd',
		);
		expect(input.backgrounds?.[0]?.dataAttributes).toEqual({ order: '1' });
	});

	it('sorts backgrounds inside a group and alternates odd/even', () => {
		const groupedData = [
			{
				key: { toString: () => 'g' },
				entries: [
					makeEntry('late.md', {
						'note.start': '2020-02-01',
						'note.end': '2020-03-01',
						'note.content': 'late',
						'note.isBackground': 'true',
					}),
					makeEntry('early.md', {
						'note.start': '2020-01-01',
						'note.end': '2020-02-01',
						'note.content': 'early',
						'note.isBackground': 'true',
					}),
				],
			},
		] as unknown as BasesEntryGroup[];

		const input = convertToVisData(
			groupedData,
			makeConfig({ backgroundWhen: 'note.isBackground' }),
			app,
		);

		expect(input.backgrounds?.map((background) => background.id)).toEqual([
			'early.md',
			'late.md',
		]);
		expect(input.backgrounds?.[0]?.content).toBe('early');
		expect(input.backgrounds?.[0]?.className).toBe(
			'timeline-background timeline-background-odd',
		);
		expect(input.backgrounds?.[0]?.dataAttributes).toEqual({ order: '1' });
		expect(input.backgrounds?.[1]?.content).toBe('late');
		expect(input.backgrounds?.[1]?.className).toBe(
			'timeline-background timeline-background-even',
		);
		expect(input.backgrounds?.[1]?.dataAttributes).toEqual({ order: '2' });
	});
});

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
