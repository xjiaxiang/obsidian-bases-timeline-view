import type { TimelineItemType } from '../type/timeline-render';

export type BuildItemContentHtmlInput = {
	path: string;
	title: string;
	start?: string;
	end?: string;
	startLabel?: string;
	endLabel?: string;
	/** `point` items show only the start, matching how vis-timeline draws them. */
	type?: TimelineItemType;
	frontmatter?: Record<string, unknown>;
	tags?: string[];
};

/**
 * Shared item HTML for Bases and api.dv: data-* wrapper, date line, internal-link.
 */
export function buildItemContentHtml(input: BuildItemContentHtmlInput): string {
	const escapedPath = escapeHtml(input.path);
	const dataAttrs = buildDataAttributes(
		input.frontmatter ?? {},
		input.tags ?? [],
	);
	const dateDescription = formatDateDescription(input);
	const attrs = ['class="timeline-item-content"'];
	if (dataAttrs) {
		attrs.push(dataAttrs);
	}

	return `<div ${attrs.join(' ')}>${dateDescription}<br><a href="${escapedPath}" class="internal-link" data-href="${escapedPath}">${escapeHtml(input.title)}</a></div>`;
}

function formatDateDescription(input: BuildItemContentHtmlInput): string {
	const startLabel = input.startLabel || input.start || '';
	if (!startLabel && !input.start) {
		return '';
	}

	// vis-timeline ignores `end` for point items; keep the date line consistent.
	const endLabel =
		input.type === 'point' ? undefined : input.endLabel || input.end;
	if (endLabel) {
		return `${startLabel} - ${endLabel}`;
	}
	return startLabel;
}

export type BuildLabelContentHtmlOptions = {
	frontmatter?: Record<string, unknown>;
	tags?: string[];
};

/**
 * Build the label HTML for a swimlane group.
 */
export function buildGroupContentHtml(
	content: string,
	opt?: BuildLabelContentHtmlOptions,
): string {
	const dataAttrs = buildDataAttributes(
		opt?.frontmatter ?? {},
		opt?.tags ?? [],
	);
	const attrs = ['class="timeline-group"'];
	if (dataAttrs) {
		attrs.push(dataAttrs);
	}

	return `<div ${attrs.join(' ')}>${escapeHtml(content)}</div>`;
}

/**
 * Build the `className` for a background item. The classes are applied by
 * vis-timeline to `.vis-item.vis-background` itself, so CSS can target
 * `.vis-item.timeline-background-odd` directly.
 */
export function buildBackgroundClassName(
	className: string | undefined,
	order?: number,
): string {
	const classes: string[] = [];
	const custom = className?.trim();
	if (custom) {
		classes.push(custom);
	}
	classes.push('timeline-background');
	if (order != null) {
		classes.push(
			`timeline-background-${order % 2 === 0 ? 'even' : 'odd'}`,
		);
	}
	return classes.join(' ');
}

/**
 * Build `data-*` attributes for a background item. These are applied to the
 * background's `.vis-item.vis-background` element by the renderer.
 */
export function buildBackgroundDataAttributes(
	frontmatter: Record<string, unknown>,
	tags: string[],
	order?: number,
): Record<string, string> {
	const attributes: Record<string, string> = {};
	if (order != null) {
		attributes.order = String(order);
	}
	Object.assign(attributes, collectDataAttributes(frontmatter, tags));
	return attributes;
}

/**
 * Build the label HTML for a background item. Empty content keeps the
 * background label-less, matching vis-timeline's default behavior.
 *
 * Order classes live on the item's `className` (see
 * {@link buildBackgroundClassName}); order and metadata data attributes are
 * applied to the item element by the renderer.
 */
export function buildBackgroundContentHtml(content?: string): string {
	return content ? escapeHtml(content) : '';
}

/**
 * Escape HTML special characters for safe use in attributes / text.
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Build data attributes for timeline item DOM (tags + frontmatter).
 * - data-tags: space-separated tag list, CSS e.g. [data-tags~="foo"]
 * - data-{key}: each frontmatter field, e.g. data-status="done"
 */
function buildDataAttributes(
	frontmatter: Record<string, unknown>,
	tags: string[],
): string {
	return Object.entries(collectDataAttributes(frontmatter, tags))
		.map(([key, value]) => `data-${key}="${escapeHtml(value)}"`)
		.join(' ');
}

/**
 * Collect raw `data-*` values (without the `data-` prefix) from tags and
 * frontmatter.
 */
function collectDataAttributes(
	frontmatter: Record<string, unknown>,
	tags: string[],
): Record<string, string> {
	const attributes: Record<string, string> = {};

	if (tags.length > 0) {
		attributes.tags = tags.join(' ');
	}

	for (const [key, value] of Object.entries(frontmatter)) {
		if (value == null) {
			continue;
		}
		const attrKey = sanitizeDataAttributeKey(key);
		if (!attrKey) {
			continue;
		}
		const attrValue = serializeDataValue(value);
		if (attrValue === undefined) {
			continue;
		}
		attributes[attrKey] = attrValue;
	}

	return attributes;
}

/**
 * Serialize a value for use in an HTML data attribute.
 */
function serializeDataValue(value: unknown): string | undefined {
	if (value == null) {
		return undefined;
	}
	if (value instanceof Date) {
		// only keep YYYY-MM-DD
		return value.toISOString().slice(0, 10);
	}
	if (Array.isArray(value)) {
		return value.map(String).join(' ');
	}
	if (typeof value === 'object') {
		// skip
		return undefined;
	}
	return String(value);
}

/**
 * Normalize a property key to a valid `data-*` attribute suffix.
 */
function sanitizeDataAttributeKey(key: string): string {
	return key
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}

