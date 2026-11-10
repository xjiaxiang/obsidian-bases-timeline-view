import { describe, expect, it } from 'vitest';
import { pagesToRenderInput } from '../src/api/dataview';

describe('pagesToRenderInput backgrounds', () => {
	it('sorts backgrounds inside a group and sets order classes on the item', () => {
		const input = pagesToRenderInput({
			backgrounds: [
				{
					file: { path: 'late.md', name: 'late' },
					start: '2020-02-01',
					end: '2020-03-01',
					group: 'g',
				},
				{
					file: { path: 'early.md', name: 'early' },
					start: '2020-01-01',
					end: '2020-02-01',
					group: 'g',
				},
			],
		});

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

	it('adds tag and frontmatter data attributes from the page file', () => {
		const input = pagesToRenderInput({
			backgrounds: [
				{
					file: {
						path: 'bg.md',
						name: 'bg',
						frontmatter: { status: 'planned' },
						etags: ['#project'],
					},
					start: '2020-01-01',
					end: '2020-02-01',
				},
			],
		});

		expect(input.backgrounds?.[0]?.content).toBe('bg');
		expect(input.backgrounds?.[0]?.className).toBe(
			'timeline-background timeline-background-odd',
		);
		expect(input.backgrounds?.[0]?.dataAttributes).toEqual({
			order: '1',
			tags: '#project',
			status: 'planned',
		});
	});
});
