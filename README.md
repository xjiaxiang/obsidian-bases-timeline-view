# obsidian-bases-timeline-view

timeline view for obsidian bases.

中文文档：[docs/README.zh-CN.md](./docs/README.zh-CN.md)

## Features

- **Custom Fields Support**: Define timeline items using custom fields in your notes. You can specify `start`, `end`, `content`, `startLabel`, and `endLabel` fields, or use Bases formulas to dynamically calculate these values. The plugin automatically falls back to default values (`note.start`, `note.end`, etc.) when custom fields are not specified.

- **Group Support**: Organize timeline items into groups using Bases' `group-by` functionality (requires Obsidian 1.10 or later). This allows you to categorize and visually separate timeline items based on any field in your notes, making it easier to view related events together.

- **Background and marker (Bases)**: Use view options `backgroundWhen` / `markerWhen` (usually Bases formulas) to draw matching notes as shaded backgrounds or vertical markers—without fixing a role on the note itself.

- **Render API**: Call `plugin.api.render(...)` from DataviewJS or other scripts to draw a timeline with separate `items`, `backgrounds`, and `markers` (no Bases query required). Use `plugin.api.dv.render(...)` to pass Dataview page lists directly.

## Example

### Basic Usage

to draw the timeline view, you need to add some properties to your obsidian file, for example:

```markdown
start: 2025-01-01
end: 2025-01-04
content: title of the item
tags: - moment
```

then you can use the bases and add a timeline view.

```base
filters:
  and:
    - file.tags.contains("moment")
    - and:
        - file.ctime >= "2025-01-01"
        - file.ctime <= "2025-12-31"
views:
  - type: timeline-view
    name: moment of 2025
```

and the result may be looked like this:
![example](./docs/example.jpg)

if you want to use the default properties, here is a quick look of the default properties:

Here is the explanation of the properties that we used:

| Property   | Description                         | Required | Example           | Remark                                          |
| ---------- | ----------------------------------- | -------- | ----------------- | ----------------------------------------------- |
| start      | the start date of the item          | no       | 2025-01-01        |                                                 |
| date       | the start date of the item          | no       | 2025-01-01        | if start is not set, it will use the date field |
| end        | the end date of the item            | no       | 2025-01-04        |                                                 |
| content    | the content of the item             | no       | title of the item | if not set, it will use the file name           |
| startLabel | custom label for display start date | no       | start             |                                                 |
| endLabel   | custom label for display end date   | no       | end               |                                                 |
| cssclasses | CSS classes on the vis item         | no       | phase-bg          | Obsidian built-in list property; space-joined   |

### Custom Field

if you don't want to use the default properties, you can use the custom properties to define the timeline items. for example:

```base
filters:
  and:
    - file.tags.contains("moment")
    - and:
        - file.ctime >= "2025-01-01"
        - file.ctime <= "2025-12-31"
views:
  - type: timeline-view
    name: moment of 2025
    startField: note.startData
    endField: note.endEnd
```

Make sure that the properties you used are defined in your obsidian file.

### Group

if your Obsidian is 1.10 or later, you can use `group by` to group the timeline items. for example:
![example](./docs/group-example.jpg)

### Background and marker (Bases)

Bases views only have one query result set. To draw backgrounds and markers without baking a role into each note:

1. Use **union filters** so events, phases, and milestones are all included.
2. Define **formulas** (or other properties) that describe _when_ a note should be drawn as background / marker.
3. On the timeline view, set **background when** / **marker when** to those properties.

Role is decided per view: the same note can be a normal item in one view and a background in another. If both options are unset, every matching note is drawn as an item (same as before).

Priority when both match: **marker** > **background** > **item**.

- Background notes need `start` and `end`.
- Marker notes need `start` (used as the vertical bar time); `content` / file name becomes the marker label.

```base
filters:
  or:
    - file.tags.contains("event")
    - file.tags.contains("phase")
    - file.tags.contains("milestone")
formulas:
  isPhase: 'file.tags.contains("phase")'
  isMilestone: 'file.tags.contains("milestone")'
views:
  - type: timeline-view
    name: Project overview
    backgroundWhen: formula.isPhase
    markerWhen: formula.isMilestone
```

### Custom Style

#### CSS classes (`cssclasses`)

By default the view reads Obsidian's built-in `cssclasses` property and sets it as the vis-timeline `className` on items and backgrounds. You can point **class name field** to another property if needed.

```markdown
cssclasses:

- phase-bg
```

```css
.vis-item.phase-bg {
	background-color: rgba(211, 211, 211, 0.45);
	border-color: #d3d3d3;
}
```

#### data attributes

we also added tags and frontmatter to the timeline item's `data-` attributes, you can use these attributes to style the timeline items. for example:

```css
.vis-item:has(.timeline-item[data-tags~='#projects']) {
	border-width: 1px;
	border-style: solid;
}

.vis-item:has(
	.timeline-item[data-tags~='#projects'][data-status='not started']
) {
	background-color: rgba(211, 211, 211, 0.45);
	border-color: #d3d3d3;
}
```

- `#projects` is a tag, you can use any tag you want
- `data-status="not started"` is a frontmatter(status), you can use any frontmatter you want

## API

Use the plugin API when you want to query data yourself (for example with DataviewJS) and pass `items`, `backgrounds`, and `markers` separately. This avoids the single-query limit of a Bases view.

### Access

Plugin id: `bases-timeline-view`

```js
const api = app.plugins.plugins['bases-timeline-view']?.api;
if (!api) {
	// plugin not enabled
}
```

### `api.render(containerEl, input, options?)`

| Argument      | Type                         | Description                                                         |
| ------------- | ---------------------------- | ------------------------------------------------------------------- |
| `containerEl` | `HTMLElement`                | Container to mount the timeline into                                |
| `input`       | `TimelineRenderInput`        | Timeline data (see below)                                           |
| `options`     | `TimelineOptions` (optional) | Extra [vis-timeline](https://github.com/visjs/vis-timeline) options |

Returns a vis-timeline `Timeline` instance.

Clear the container before re-rendering (DataviewJS re-runs often):

```js
this.container.empty();
api.render(this.container, input);
```

### Input shape

```ts
type TimelineRenderInput = {
	items?: TimelineItemInput[];
	backgrounds?: TimelineBackgroundInput[];
	markers?: TimelineMarkerInput[];
	groups?: TimelineGroupInput[];
};
```

| Field         | Role                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| `items`       | Normal events (point / range)                                                          |
| `backgrounds` | Shaded ranges (`type: 'background'`). Omit `group` for a full-width band               |
| `markers`     | Vertical custom-time bars (`addCustomTime`)                                            |
| `groups`      | Swimlanes. If omitted, group ids used on items/backgrounds are collected automatically |

**Item**

| Field                 | Required | Description                                      |
| --------------------- | -------- | ------------------------------------------------ |
| `start`               | yes      | `string \| number \| Date`                       |
| `content`             | yes      | Plain text or HTML (e.g. with `a.internal-link`) |
| `end`                 | no       | If set, drawn as a range                         |
| `id`                  | no       | Stable id (recommended: note path)               |
| `group`               | no       | Group id                                         |
| `className` / `title` | no       | CSS class / hover title                          |

**Background**

| Field                                  | Required | Description                                                    |
| -------------------------------------- | -------- | -------------------------------------------------------------- |
| `start` / `end`                        | yes      | Range                                                          |
| `content`                              | no       | Label / identifier                                             |
| `id` / `group` / `className` / `style` | no       | Same idea as items; `style` e.g. `background-color: rgba(...)` |

**Marker**

| Field   | Required | Description         |
| ------- | -------- | ------------------- |
| `time`  | yes      | Marker time         |
| `id`    | no       | Custom time id      |
| `title` | no       | Label on the marker |

**Group**

| Field                 | Required | Description |
| --------------------- | -------- | ----------- |
| `id`                  | yes      | Group id    |
| `content`             | yes      | Group label |
| `className` / `order` | no       |             |

### Dataview shortcut: `api.dv.render`

Pass Dataview page lists directly (three queries instead of hand-mapping). Requires [Dataview](https://github.com/blacksmithgu/obsidian-dataview).

```js
api.dv.render(containerEl, {
  items?: pages,          // normal events (date line + note link + data-*)
  backgrounds?: pages,    // need start + end (plain text title)
  markers?: pages | { time, title?, id? }[],
  fields?: {
    start?: string,       // default: page.start, then page.date
    end?: string,         // default: end
    content?: string,     // default: content, then file.name
    className?: string,   // default: cssclasses
    group?: string,       // optional page property; overridden by element.group
    startLabel?: string,  // optional display label for start
    endLabel?: string,    // optional display label for end
  },
  options?: TimelineOptions,
})
```

Default field mapping:

| Page field                                | Timeline field                                   |
| ----------------------------------------- | ------------------------------------------------ |
| `start`, else `date`                      | `start` / marker `time`                          |
| `end`                                     | `end`                                            |
| `content`, else `file.name`               | title text inside the item link / marker `title` |
| `cssclasses` (list joined)                | `className`                                      |
| `file.path`                               | `id` + link target                               |
| optional `fields.startLabel` / `endLabel` | date line labels                                 |
| optional `fields.group`                   | swimlane id from that page property              |
| element `group` (own property)            | overrides `fields.group` for that row            |

`api.dv.render` builds the same item HTML as the Bases view (date line, `a.internal-link`, frontmatter/tags `data-*`) and wires click + Page Preview hover. Grouping: element-level `group` wins over `fields.group`; when any row has a group, rows without one go to `Other`.

Example — different group sources for items vs backgrounds:

```js
api.dv.render(this.container, {
	items: dv.pages('#event').map((p) => ({ ...p, group: p.dynasty })),
	backgrounds: dv.pages('#phase').map((p) => ({ ...p, group: p.area })),
	// fields.group optional when every row sets group manually
});
```

````markdown
```dataviewjs
const api = app.plugins.plugins['bases-timeline-view']?.api;
if (!api?.dv) {
  dv.paragraph('Enable the Bases Timeline View plugin first.');
  return;
}

this.container.empty();
this.container.style.height = '400px'; // recommended for Dataview embeds
api.dv.render(this.container, {
  items: dv.pages('#event'),
  backgrounds: dv.pages('#phase'),
  markers: dv.pages('#milestone'),
});
```
````

### Low-level DataviewJS example

If you need full control, map pages yourself and call `api.render`:

````markdown
```dataviewjs
const api = app.plugins.plugins['bases-timeline-view']?.api;
if (!api) {
  dv.paragraph('Enable the Bases Timeline View plugin first.');
  return;
}

const items = dv.pages('#event')
  .where(p => p.start)
  .map(p => ({
    id: p.file.path,
    start: p.start,
    end: p.end,
    content: p.content ?? p.file.name,
    group: p.area,
  }));

const backgrounds = dv.pages('#phase')
  .where(p => p.start && p.end)
  .map(p => ({
    id: p.file.path,
    start: p.start,
    end: p.end,
    content: p.file.name,
    className: 'phase-bg',
  }));

const markers = [
  { id: 'launch', time: '2025-03-01', title: 'Launch' },
];

const groups = [...new Set(items.map(i => i.group).filter(Boolean))]
  .map(id => ({ id, content: String(id) }));

this.container.empty();
this.container.style.height = '400px'; // recommended for Dataview embeds
api.render(this.container, { items, backgrounds, markers, groups });
```
````

The same note can be an `item` in one query and a `background` in another — the API does not read a fixed role from frontmatter.

### Notes

- `api.render` and `api.dv.render` wire Obsidian link click (`openLinkText`) and Page Preview (`hover-link`) on the container. With `api.dv`, items already include `a.internal-link`; with `api.render`, that only helps if your `content` HTML contains those links.
- Prefer stable `id` values when you re-render. Call `container.empty()` before re-render in DataviewJS.
- Set a fixed `container.style.height` in Dataview embeds to avoid layout / redraw issues.
- `options` is passed through to vis-timeline; keep overrides minimal unless you need them.

## Tips

- Date values are normalized the same way in Bases views and `api` / `api.dv.render` (strings, `Date`, and numbers → moment → `YYYY-MM-DD`).
- Partial inputs like `"2025"` or `"2025-01"` are expanded to a full day by moment (e.g. `2025-01-01`). If you need year-only semantics in Obsidian properties, prefer a **Text** type and be aware it will still be normalized to `YYYY-MM-DD` for drawing.

## Installation

Three ways to install:

- Install from Obsidian Community Plugin（Not released yet）
- Manual install
  - Download the latest release from [GitHub Releases](https://github.com/xiang2x/obsidian-bases-timeline-view/releases)
  - Create a new folder named `bases-timeline-view` in your Obsidian plugins folder(`.obsidian/plugins/`)
  - Move the downloaded files to the new folder
  - Reload Obsidian
  - Enable the plugin in **Settings → Community plugins**
- Install from BRAT(Currently Recommended)
  - Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) if you haven't installed it yet.
  - Enable BRAT in **Settings → Community plugins**
  - Open Command Palette(Ctrl+P) and type `BRAT: Plugins: Add a beta plugin for test` to open the Community Plugin Manager.
  - input the plugin repository url: https://github.com/xiang2x/obsidian-bases-timeline-view
  - select the latest version
  - click `Add plugin` button to install the plugin.
  - enable `bases-timeline-view` plugin in **Settings → Community plugins** if it's not enabled automatically.

## Others

- Thanks to [vis-timeline](https://github.com/visjs/vis-timeline) and [obsidian timeline](https://github.com/Darakah/obsidian-timelines)
