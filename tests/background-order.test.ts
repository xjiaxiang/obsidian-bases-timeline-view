import { describe, expect, it } from 'vitest';
import { orderBackgroundsByGroup } from '../src/helper/background-order';

describe('orderBackgroundsByGroup', () => {
	it('sorts backgrounds within a group and assigns a 1-based order', () => {
		const ordered = orderBackgroundsByGroup([
			{ id: 'third', start: '2020-03-01', end: '2020-04-01', group: 'g' },
			{ id: 'first', start: '2020-01-01', end: '2020-02-01', group: 'g' },
			{ id: 'second', start: '2020-02-01', end: '2020-03-01', group: 'g' },
		]);

		expect(ordered.map(({ background }) => background.id)).toEqual([
			'first',
			'second',
			'third',
		]);
		expect(ordered.map(({ order }) => order)).toEqual([1, 2, 3]);
	});

	it('keeps group sequences independent', () => {
		const ordered = orderBackgroundsByGroup([
			{ id: 'a2', start: '2020-02-01', end: '2020-03-01', group: 'a' },
			{ id: 'b1', start: '2020-01-01', end: '2020-02-01', group: 'b' },
			{ id: 'a1', start: '2020-01-01', end: '2020-02-01', group: 'a' },
		]);

		const byId = new Map(
			ordered.map(({ background, order }) => [background.id, order]),
		);
		expect(byId.get('a1')).toBe(1);
		expect(byId.get('a2')).toBe(2);
		expect(byId.get('b1')).toBe(1);
	});

	it('sorts by end time when start times are equal', () => {
		const ordered = orderBackgroundsByGroup([
			{ id: 'long', start: '2020-01-01', end: '2020-03-01' },
			{ id: 'short', start: '2020-01-01', end: '2020-02-01' },
		]);

		expect(ordered.map(({ background }) => background.id)).toEqual([
			'short',
			'long',
		]);
	});

	it('keeps the input order for equal ranges', () => {
		const ordered = orderBackgroundsByGroup([
			{ id: 'first', start: '2020-01-01', end: '2020-02-01' },
			{ id: 'second', start: '2020-01-01', end: '2020-02-01' },
		]);

		expect(ordered.map(({ background }) => background.id)).toEqual([
			'first',
			'second',
		]);
	});
});
