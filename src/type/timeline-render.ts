/** Calendar-fields object, e.g. a Luxon DateTime from Dataview.
 * `month` is 1–12; time fields default to 0. Fields are read in the object's
 * own zone, so the calendar day matches what Dataview shows. */
export type TimelineCalendarDate = {
	readonly year: number;
	readonly month: number;
	readonly day: number;
	readonly hour?: number;
	readonly minute?: number;
	readonly second?: number;
	readonly millisecond?: number;
};

/** Moment-style accessors (Obsidian's moment); `month()` is 0-based. */
export type TimelineMomentDate = {
	readonly year: () => number;
	readonly month: () => number;
	readonly date: () => number;
};

/** Calendar string (YYYY / YYYY-MM / YYYY-MM-DD), numeric year, Date,
 * Luxon DateTime (Dataview), or Moment.
 * Negative years use astronomical numbering (0 = 1 BCE, -1 = 2 BCE).
 * Date objects use their UTC day in Bases / api.dv adapters. */
export type TimelineDate =
	| string
	| number
	| Date
	| TimelineCalendarDate
	| TimelineMomentDate;

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
	/**
	 * Ready-to-insert DOM string (plain text or HTML). The Bases and Dataview
	 * adapters add order classes to `className` and metadata to
	 * `dataAttributes`; API callers can supply the same values directly.
	 */
	content?: string;
	group?: string;
	className?: string;
	style?: string;
	/**
	 * Extra `data-*` attributes applied to the background's item element
	 * (without the `data-` prefix). The Bases and Dataview adapters fill this
	 * with order, tags and frontmatter.
	 */
	dataAttributes?: Record<string, string>;
};

export type TimelineMarkerInput = {
	id?: string;
	time: TimelineDate;
	title?: string;
};

export type TimelineGroupInput = {
	id: string;
	/** Ready-to-insert DOM string (plain text or HTML). */
	content: string;
	className?: string;
	order?: number;
	/**
	 * Extra properties are exposed as `data-*` attributes on the group's
	 * label and `.vis-group` elements (`id`, `content`, `className`, `order`
	 * are reserved).
	 */
	[key: string]: unknown;
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
