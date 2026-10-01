export type BuildItemContentHtmlInput = {
	path: string;
	title: string;
	start?: string;
	end?: string;
	startLabel?: string;
	endLabel?: string;
	frontmatter?: Record<string, unknown>;
	tags?: string[];
};

/**
 * Shared item HTML for Bases and api.dv: data-* wrapper, date line, internal-link.
 */
export function buildItemContentHtml(input: BuildItemContentHtmlInput): string {
	const escapedPath = escapeHtml(input.path);
	const dataAttrs = buildItemDataAttributes(
		input.frontmatter ?? {},
		input.tags ?? [],
	);
	const dateDescription = formatDateDescription(input);

	return `<div ${dataAttrs}>${dateDescription}<br><a href="${escapedPath}" class="internal-link" data-href="${escapedPath}">${escapeHtml(input.title)}</a></div>`;
}

function formatDateDescription(input: BuildItemContentHtmlInput): string {
	const startLabel = input.startLabel || input.start || '';
	if (!startLabel && !input.start) {
		return '';
	}

	const endLabel = input.endLabel || input.end;
	if (endLabel) {
		return `${startLabel} - ${endLabel}`;
	}
	return startLabel;
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
function buildItemDataAttributes(
	frontmatter: Record<string, unknown>,
	tags: string[],
): string {
	const attrs = ['class="timeline-item"'];

	if (tags.length > 0) {
		attrs.push(`data-tags="${escapeHtml(tags.join(' '))}"`);
	}

	for (const [key, value] of Object.entries(frontmatter)) {
		if (value == null) {
			continue;
		}
		const attrKey = sanitizeDataAttributeKey(key);
		if (!attrKey) {
			continue;
		}
		const attrValue = serializeFrontmatterValue(value);
		if (attrValue === undefined) {
			continue;
		}
		attrs.push(`data-${attrKey}="${escapeHtml(attrValue)}"`);
	}

	return attrs.join(' ');
}

function serializeFrontmatterValue(value: unknown): string | undefined {
	if (value == null) {
		return undefined;
	}
	if (Array.isArray(value)) {
		return value.map(String).join(' ');
	}
	if (typeof value === 'object') {
		return JSON.stringify(value);
	}
	return String(value);
}

function sanitizeDataAttributeKey(key: string): string {
	return key
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}
