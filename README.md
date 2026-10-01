# obsidian-bases-timeline-view

timeline view for obsidian bases.

## Features

- **Custom Fields Support**: Define timeline items using custom fields in your notes. You can specify `start`, `end`, `content`, `startLabel`, and `endLabel` fields, or use Bases formulas to dynamically calculate these values. The plugin automatically falls back to default values (`note.start`, `note.end`, etc.) when custom fields are not specified.

- **Group Support**: Organize timeline items into groups using Bases' `group-by` functionality (requires Obsidian 1.10 or later). This allows you to categorize and visually separate timeline items based on any field in your notes, making it easier to view related events together.

- **Render API**: Call `plugin.api.render(...)` from DataviewJS or other scripts to draw a timeline with separate `items`, `backgrounds`, and `markers` (no Bases query required).

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

### Custom Style

we added tags and frontmatter to the timeline item's `data-` attributes, you can use these attributes to style the timeline items. for example:

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

### DataviewJS example

Requires [Dataview](https://github.com/blacksmithgu/obsidian-dataview) and this plugin enabled.

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
api.render(this.container, { items, backgrounds, markers, groups });
```
````

The same note can be an `item` in one query and a `background` in another — the API does not read a fixed role from frontmatter.

### Notes

- The API does **not** wire Obsidian link click / hover preview for you. If `content` contains `a.internal-link`, handle open/hover on your container (the Bases timeline view does this internally).
- Prefer stable `id` values when you re-render.
- `options` is passed through to vis-timeline; keep overrides minimal unless you need them.

## Tips

- basically, `start` and `end` should be `Date` type, but if your `start` is something unusual, for example "2025" or "2025-01", you should use `String` type

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
