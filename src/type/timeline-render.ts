/** Date accepted by the timeline render API (normalized to string before draw when via Bases / api.dv). */
export type TimelineDate = string | number | Date;

export type TimelineItemType = 'box' | 'point' | 'range';

export type TimelineItemInput = {
	id?: string;
	start: TimelineDate;
	end?: TimelineDate;
	/** Ready-to-insert DOM string (plain text or HTML with internal-link) */
	content: string;
	/** vis-timeline item type. Omit to use vis defaults (box, or range when `end` is set). */
	type?: TimelineItemType;
	group?: string;
	className?: string;
	title?: string;
};

export type TimelineBackgroundInput = {
	id?: string;
	start: TimelineDate;
	end: TimelineDate;
	content?: string;
	group?: string;
	className?: string;
	style?: string;
};

export type TimelineMarkerInput = {
	id?: string;
	time: TimelineDate;
	title?: string;
};

export type TimelineGroupInput = {
	id: string;
	content: string;
	className?: string;
	order?: number;
};

/**
 * Generic timeline payload for {@link drawVisTimeline} / `plugin.api.render`.
 * Callers (Bases adapter, DataviewJS, scripts) supply already-classified data;
 * the render layer does not decide roles.
 *
 * @example
 * ```ts
 * const input: TimelineRenderInput = {
 *   items: [
 *     { start: '2025-01-01', end: '2025-01-03', content: 'Ship', group: 'eng' },
 *   ],
 *   backgrounds: [{ start: '2025-01-01', end: '2025-03-31', content: 'Q1' }],
 *   markers: [{ time: '2025-03-01', title: 'Launch' }],
 *   groups: [{ id: 'eng', content: 'Engineering' }],
 * };
 * ```
 */
export type TimelineRenderInput = {
	/** Normal timeline events (box / range / point). */
	items?: TimelineItemInput[];
	/**
	 * Shaded ranges behind items (`type: 'background'` in vis-timeline).
	 * Omit `group` for a full-width band; set `group` to limit to one swimlane.
	 */
	backgrounds?: TimelineBackgroundInput[];
	/**
	 * Vertical custom-time bars (not DataItems).
	 * Drawn via `addCustomTime` after the timeline is created.
	 */
	markers?: TimelineMarkerInput[];
	/**
	 * Swimlanes. If omitted while items/backgrounds set `group`,
	 * missing group ids are auto-collected from those fields.
	 */
	groups?: TimelineGroupInput[];
};
