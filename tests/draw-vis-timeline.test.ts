import { describe, expect, it, vi } from 'vitest';
import { drawVisTimeline } from '../src/helper/draw-vis-timeline';

const calls = vi.hoisted(() => ({
	construct: vi.fn(),
	marker: vi.fn(() => 'marker'),
}));
vi.mock('vis-timeline/esnext', () => ({
	Timeline: class {
		constructor(...args: unknown[]) {
			calls.construct(...args);
		}
		on = vi.fn();
		off = vi.fn();
		addCustomTime = calls.marker;
	},
}));

function createContainer(): HTMLElement {
	return {
		classList: { add: vi.fn() },
	} as unknown as HTMLElement;
}

describe('timeline calendar inputs', () => {
	it('passes parsed Dates to vis for events, backgrounds and markers', () => {
		const date = new Date(-8640000000000000);
		drawVisTimeline(createContainer(), {
			items: [
				{ id: 'bce', start: '-0044', end: '-0043-03', content: '' },
				{ id: 'year', start: 2025, content: '' },
				{ id: 'date', start: date, content: '' },
				{
					id: 'luxon',
					start: { year: 2025, month: 3, day: 15 },
					content: '',
				},
				{ id: 'invalid', start: '2025-02-30', content: '' },
			],
			backgrounds: [{ id: 'bg', start: '-0100', end: 0 }],
			markers: [{ time: '-0001-03-15' }],
		});
		const [, items] = calls.construct.mock.calls.at(-1)!;
		expect(items.get('bce').start.toISOString()).toBe(
			'-000044-01-01T00:00:00.000Z',
		);
		expect(items.get('bce').end.toISOString()).toBe(
			'-000043-03-01T00:00:00.000Z',
		);
		expect(items.get('year').start.getUTCFullYear()).toBe(2025);
		expect(items.get('date').start.getTime()).toBe(date.getTime());
		expect(items.get('luxon').start.toISOString()).toBe(
			'2025-03-15T00:00:00.000Z',
		);
		expect(items.get('bg').end.getUTCFullYear()).toBe(0);
		expect(items.get('invalid')).toBeNull();
		expect(calls.marker).toHaveBeenLastCalledWith(
			new Date('-000001-03-15T00:00:00.000Z'),
			undefined,
		);
	});

	it('passes background content and classes through to vis', () => {
		drawVisTimeline(createContainer(), {
			groups: [{ id: 'g', content: 'G' }],
			backgrounds: [
				{
					id: 'late',
					start: '2020-02-01',
					end: '2020-03-01',
					group: 'g',
					className:
						'timeline-background timeline-background-even',
					content: '<div data-order="2">late</div>',
				},
				{
					id: 'early',
					start: '2020-01-01',
					end: '2020-02-01',
					group: 'g',
					className:
						'timeline-background timeline-background-odd',
					content: '<div data-order="1">early</div>',
				},
			],
		});

		const [, items] = calls.construct.mock.calls.at(-1)!;
		expect(items.get('early').className).toBe(
			'timeline-background timeline-background-odd',
		);
		expect(items.get('late').className).toBe(
			'timeline-background timeline-background-even',
		);
	});
});
