import { describe, expect, it } from 'vitest';
import {
	OTHER_GROUP_ID,
	normalizeGroupKey,
	resolveTimelineGroupId,
} from '../src/helper/timeline-group';

describe('normalizeGroupKey', () => {
	it.each([undefined, null, '', '   '])('treats %j as empty', (raw) => {
		expect(normalizeGroupKey(raw)).toBeUndefined();
	});

	it.each(['null', 'NULL', 'undefined', 'Undefined'])(
		'treats Bases-style %j as empty',
		(raw) => {
			expect(normalizeGroupKey(raw)).toBeUndefined();
		},
	);

	it('keeps a real group label', () => {
		expect(normalizeGroupKey('  宋  ')).toBe('宋');
	});
});

describe('resolveTimelineGroupId', () => {
	it('returns Other for null-like keys when grouping is active', () => {
		expect(resolveTimelineGroupId('null', true)).toBe(OTHER_GROUP_ID);
		expect(resolveTimelineGroupId(undefined, true)).toBe(OTHER_GROUP_ID);
	});

	it('returns undefined for null-like keys when grouping is inactive', () => {
		expect(resolveTimelineGroupId('null', false)).toBeUndefined();
	});

	it('keeps a real group id', () => {
		expect(resolveTimelineGroupId('唐', true)).toBe('唐');
	});
});
