import { describe, expect, it, vi } from 'vitest';
import type { Timeline } from 'vis-timeline/esnext';
import { applyBackgroundDataAttributes } from '../src/helper/timeline-background-attributes';

function makeTimeline(items: Record<string, unknown>): Timeline {
	return { itemSet: { items } } as unknown as Timeline;
}

describe('applyBackgroundDataAttributes', () => {
	it('writes data attributes to the background item box', () => {
		const setAttribute = vi.fn();
		const timeline = makeTimeline({
			bg: {
				id: 'bg',
				data: { type: 'background' },
				dom: { box: { setAttribute } },
			},
		});

		applyBackgroundDataAttributes(
			timeline,
			new Map([['bg', { order: '1', tags: 'a b' }]]),
		);

		expect(setAttribute).toHaveBeenNthCalledWith(1, 'data-order', '1');
		expect(setAttribute).toHaveBeenNthCalledWith(2, 'data-tags', 'a b');
	});

	it('falls back to the item key when the item has no id', () => {
		const setAttribute = vi.fn();
		const timeline = makeTimeline({
			bg: {
				data: { type: 'background' },
				dom: { box: { setAttribute } },
			},
		});

		applyBackgroundDataAttributes(
			timeline,
			new Map([['bg', { order: '3' }]]),
		);

		expect(setAttribute).toHaveBeenCalledWith('data-order', '3');
	});

	it('skips non-background items and unknown ids', () => {
		const setAttribute = vi.fn();
		const timeline = makeTimeline({
			item: {
				id: 'item',
				data: { type: 'box' },
				dom: { box: { setAttribute } },
			},
			other: {
				id: 'other',
				data: { type: 'background' },
				dom: { box: { setAttribute } },
			},
		});

		applyBackgroundDataAttributes(
			timeline,
			new Map([['item', { order: '1' }]]),
		);

		expect(setAttribute).not.toHaveBeenCalled();
	});
});
