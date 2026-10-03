# API reference

When you need to query data yourself (e.g. DataviewJS), use the plugin `api`:

| Method                                     | When to use                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `api.render(containerEl, input, options?)` | You already have a generic data shape and want full control                           |
| `api.dv.render(containerEl, sources)`      | Pass Dataview page lists; the plugin maps fields and builds the default item template |

Plugin id: `bases-timeline-view`.

```js
const api = app.plugins.plugins['bases-timeline-view']?.api;
if (!api) {
	// 插件未启用
	dv.paragraph('请升级并启用 Bases Timeline View');
} else {
	// 调用 api.render / api.dv.render
}
```

---

## `api.render(containerEl, input, options?)`

### Signature

```ts
api.render(
  containerEl: HTMLElement,
  input: TimelineRenderInput,
  options?: TimelineOptions, // optional vis-timeline options
): Timeline
```

### Parameters

| Name          | Type                  | Required | Description                                                                                                   |
| ------------- | --------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `containerEl` | `HTMLElement`         | yes      | DOM container for the timeline                                                                                |
| `input`       | `TimelineRenderInput` | yes      | Timeline data (see below)                                                                                     |
| `options`     | `TimelineOptions`     | no       | Passed through to [vis-timeline](https://github.com/visjs/vis-timeline); defaults include `selectable: false` |

### `TimelineRenderInput`

```ts
type TimelineDate = string | number | Date;

type TimelineRenderInput = {
	items?: TimelineItemInput[];
	backgrounds?: TimelineBackgroundInput[];
	markers?: TimelineMarkerInput[];
	groups?: TimelineGroupInput[];
};
```

| Field         | Type                        | Description                                                          |
| ------------- | --------------------------- | -------------------------------------------------------------------- |
| `items`       | `TimelineItemInput[]`       | Normal events (point or range)                                       |
| `backgrounds` | `TimelineBackgroundInput[]` | Shaded bands; omit `group` for a full-width band                     |
| `markers`     | `TimelineMarkerInput[]`     | Vertical custom times (`addCustomTime`)                              |
| `groups`      | `TimelineGroupInput[]`      | Swimlanes; if omitted, collected from item/background `group` values |

#### `TimelineItemInput`

| Field       | Type                          | Required | Description                                                                               |
| ----------- | ----------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `start`     | `TimelineDate`                | yes      | Start time                                                                                |
| `content`   | `string`                      | yes      | Display content: plain text or HTML (may include `a.internal-link`)                       |
| `end`       | `TimelineDate`                | no       | If set, vis-timeline defaults to a range                                                  |
| `type`      | `'box' \| 'point' \| 'range'` | no       | vis-timeline item type. Omit to use vis defaults. Not read from Bases / note frontmatter. |
| `id`        | `string`                      | no       | Stable id (prefer note path)                                                              |
| `group`     | `string`                      | no       | Swimlane id                                                                               |
| `className` | `string`                      | no       | CSS class                                                                                 |
| `title`     | `string`                      | no       | Native hover title                                                                        |

#### `TimelineBackgroundInput`

| Field       | Type           | Required | Description                                |
| ----------- | -------------- | -------- | ------------------------------------------ |
| `start`     | `TimelineDate` | yes      | Range start                                |
| `end`       | `TimelineDate` | yes      | Range end                                  |
| `content`   | `string`       | no       | Label text                                 |
| `id`        | `string`       | no       | Stable id                                  |
| `group`     | `string`       | no       | Limit to one swimlane; omit for full-width |
| `className` | `string`       | no       | CSS class                                  |
| `style`     | `string`       | no       | e.g. `background-color: rgba(0,0,0,0.08)`  |

#### `TimelineMarkerInput`

| Field   | Type           | Required | Description             |
| ------- | -------------- | -------- | ----------------------- |
| `time`  | `TimelineDate` | yes      | Marker time             |
| `id`    | `string`       | no       | Custom time id          |
| `title` | `string`       | no       | Label beside the marker |

#### `TimelineGroupInput`

| Field       | Type     | Required | Description                                   |
| ----------- | -------- | -------- | --------------------------------------------- |
| `id`        | `string` | yes      | Swimlane id (matches item/background `group`) |
| `content`   | `string` | yes      | Left-side swimlane label                      |
| `className` | `string` | no       | CSS class                                     |
| `order`     | `number` | no       | Swimlane order                                |

---

## `api.dv.render(containerEl, sources)`

Maps Dataview page lists, builds the same item HTML as the Bases Timeline view (date line + note link + frontmatter/tags `data-*`), and wires click + Page Preview.

Requires [Dataview](https://github.com/blacksmithgu/obsidian-dataview).

### Signature

```ts
api.dv.render(
  containerEl: HTMLElement,
  sources: DataviewRenderSources,
): Timeline
```

### Parameters (`DataviewRenderSources`)

| Field         | Type                                   | Required | Description                            |
| ------------- | -------------------------------------- | -------- | -------------------------------------- |
| `items`       | `DataviewPageLike[]` / Iterable        | no       | Normal event pages                     |
| `backgrounds` | `DataviewPageLike[]` / Iterable        | no       | Background pages (need start + end)    |
| `markers`     | page list or `{ time, title?, id? }[]` | no       | Pages use start as time; or literals   |
| `fields`      | `DataviewFieldMap`                     | no       | Page property → timeline field mapping |
| `options`     | `TimelineOptions`                      | no       | Passed through to vis-timeline         |

`DataviewPageLike`: any page-like object with `file.path` / `file.name`; may include an own `group` property as a swimlane override.

### `fields` (`DataviewFieldMap`)

| Field        | Default                     | Description                                                        |
| ------------ | --------------------------- | ------------------------------------------------------------------ |
| `start`      | `start`, then `date`        | Start date property; if set explicitly, only that property is read |
| `end`        | `end`                       | End date property                                                  |
| `content`    | `content`, else `file.name` | Title text property                                                |
| `className`  | `cssclasses`                | CSS class property (lists joined with spaces)                      |
| `group`      | none                        | Swimlane property; **element `group` wins**                        |
| `startLabel` | none                        | Display label property for the date line start                     |
| `endLabel`   | none                        | Display label property for the date line end                       |

### Mapping behavior

| Page side                               | Timeline side                                  |
| --------------------------------------- | ---------------------------------------------- |
| `file.path`                             | item/background/marker `id`; item link target  |
| dates from `fields` / defaults          | via `normalizeVisDate` → `YYYY-MM-DD`          |
| item                                    | HTML: date line + `a.internal-link` + `data-*` |
| background                              | plain-text `content` (title), no link template |
| marker (page)                           | `time` ← start, `title` ← content              |
| element own `group`                     | overrides `fields.group`                       |
| some rows have group, this row does not | swimlane id `Other`                            |

Items without start, backgrounds missing start/end, and markers with invalid time are skipped (`console.warn`) without aborting the whole chart.
