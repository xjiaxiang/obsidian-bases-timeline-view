export const CUSTOM_RENDER_TEMPLATE = `\`\`\`dataviewjs
const api = app.plugins.plugins['bases-timeline-view']?.api;
if (!api) {
  dv.paragraph('Please enable the Bases Timeline View plugin first.');
} else {
  const items = [
    {
      id: 'notes/event-a.md',
      start: '2025-01-01',
      end: '2025-01-03',
      content: 'Event A',
      group: 'Engineering',
    },
    {
      id: 'notes/event-b.md',
      start: '2025-02-10',
      content: 'Event B',
      group: 'Design',
    },
  ];

  const backgrounds = [
    {
      id: 'notes/Q1.md',
      start: '2025-01-01',
      end: '2025-03-31',
      content: 'Q1',
      className: 'phase-bg',
    },
  ];

  const markers = [
    { id: 'launch', time: '2025-03-01', title: 'Launch' },
  ];

  api.render(this.container, { items, backgrounds, markers });
}
\`\`\`
`;

export const DATAVIEW_RENDER_TEMPLATE = `\`\`\`dataviewjs
const api = app.plugins.plugins['bases-timeline-view']?.api;
if (!api?.dv) {
  dv.paragraph('Please enable the Bases Timeline View plugin first.');
} else {
	api.dv.render(this.container, {
		items: dv.pages('#event'),
		backgrounds: dv.pages('#phase'),
		markers: dv.pages('#milestone'),
	});
}
\`\`\`
`;
