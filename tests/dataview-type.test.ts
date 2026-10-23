import { describe, expect, it, vi } from 'vitest';
import { pagesToRenderInput } from '../src/api/dataview';
import { logger } from '../src/helper/logger';

function page(path: string, extra: Record<string, unknown> = {}) {
	return {
		file: { path, name: path },
		start: '2020-01-01',
		...extra,
	};
}

describe('pagesToRenderInput item type', () => {
	it('maps fields.type to item type', () => {
		const input = pagesToRenderInput({
			items: [
				page('a.md', { kind: 'point' }),
				page('b.md', { kind: 'range', end: '2020-02-01' }),
			],
			fields: { type: 'kind' },
		});

		expect(input.items?.map((item) => item.type)).toEqual([
			'point',
			'range',
		]);
	});

	it('lets fields.type take precedence over element type', () => {
		const input = pagesToRenderInput({
			items: [page('a.md', { kind: 'box', type: 'point' })],
			fields: { type: 'kind' },
		});

		expect(input.items?.[0]?.type).toBe('box');
	});

	it('falls back to a valid element type when fields.type is unset', () => {
		const input = pagesToRenderInput({
			items: [
				page('a.md', { type: 'point' }),
				page('b.md', { type: 'book' }),
			],
		});

		expect(input.items?.map((item) => item.type)).toEqual([
			'point',
			undefined,
		]);
	});

	it('passes end through but omits it from point content', () => {
		const input = pagesToRenderInput({
			items: [
				page('a.md', {
					kind: 'point',
					end: '2020-02-01',
					endLabel: 'Feb',
				}),
			],
			fields: { type: 'kind' },
		});

		const item = input.items?.[0];
		expect(item?.end).toBe('2020-02-01');
		expect(item?.content).toContain('2020-01-01');
		expect(item?.content).not.toContain('Feb');
		expect(item?.content).not.toContain('2020-02-01');
	});

	it('requires an exact match', () => {
		const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {});
		const input = pagesToRenderInput({
			items: [
				page('a.md', { kind: 'book' }),
				page('b.md', { kind: 'Point' }),
			],
			fields: { type: 'kind' },
		});

		expect(input.items?.map((item) => item.type)).toEqual([
			undefined,
			undefined,
		]);
		expect(warn).toHaveBeenCalledTimes(2);
		warn.mockRestore();
	});
});
