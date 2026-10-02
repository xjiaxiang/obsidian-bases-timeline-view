/** Swimlane for entries that lack a group value while grouping is active. */
export const OTHER_GROUP_ID = 'Omitted';

/**
 * Normalize a raw group key from Bases / Dataview.
 * Bases missing values often stringify to `"null"` / `"undefined"`.
 */
export function normalizeGroupKey(raw?: string | null): string | undefined {
	const key = raw?.trim();
	if (!key) {
		return undefined;
	}
	if (/^(null|undefined)$/i.test(key)) {
		return undefined;
	}
	return key;
}

/**
 * Resolve a timeline group id.
 * When grouping is active and the raw key is empty, fall back to {@link OTHER_GROUP_ID}.
 */
export function resolveTimelineGroupId(
	raw: string | undefined | null,
	hasGrouping: boolean,
): string | undefined {
	const key = normalizeGroupKey(raw);
	if (key) {
		return key;
	}
	return hasGrouping ? OTHER_GROUP_ID : undefined;
}
