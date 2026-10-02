import { describe, expect, it } from 'vitest';
import { pagesToRenderInput } from '../src/api/dataview';
import { OTHER_GROUP_ID } from '../src/helper/timeline-group';

describe('pagesToRenderInput group override', () => {
	it('lets element.group override fields.group', () => {
		const input = pagesToRenderInput({
			items: [
				{
					file: { path: 'a.md', name: 'a' },
					start: '2020-01-01',
					dynasty: '唐',
					group: '手动唐',
				},
				{
					file: { path: 'b.md', name: 'b' },
					start: '2021-01-01',
					dynasty: '宋',
				},
			],
			fields: { group: 'dynasty' },
		});

		expect(input.items?.map((i) => i.group)).toEqual(['手动唐', '宋']);
	});

	it('supports grouping with only manual element.group (no fields.group)', () => {
		const input = pagesToRenderInput({
			items: [
				{
					file: { path: 'a.md', name: 'a' },
					start: '2020-01-01',
					group: 'A',
				},
				{
					file: { path: 'b.md', name: 'b' },
					start: '2021-01-01',
				},
			],
		});

		expect(input.items?.map((i) => i.group)).toEqual(['A', OTHER_GROUP_ID]);
		expect(input.groups?.map((g) => g.id).sort()).toEqual(
			['A', OTHER_GROUP_ID].sort(),
		);
	});

	it('allows items and backgrounds to use different manual groups', () => {
		const input = pagesToRenderInput({
			items: [
				{
					file: { path: 'e.md', name: 'e' },
					start: '2020-01-01',
					group: 'dynasty-唐',
				},
			],
			backgrounds: [
				{
					file: { path: 'p.md', name: 'p' },
					start: '2020-01-01',
					end: '2021-01-01',
					group: 'area-北',
				},
			],
		});

		expect(input.items?.[0]?.group).toBe('dynasty-唐');
		expect(input.backgrounds?.[0]?.group).toBe('area-北');
	});
});
