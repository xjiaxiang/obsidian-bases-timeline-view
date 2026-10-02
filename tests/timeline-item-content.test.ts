import { describe, expect, it } from 'vitest';
import {
	buildItemContentHtml,
	escapeHtml,
} from '../src/helper/timeline-item-content';

describe('buildItemContentHtml', () => {
	describe('basic structure', () => {
		it('wraps path and title in a timeline-item with internal-link', () => {
			expect(
				buildItemContentHtml({
					path: 'notes/a.md',
					title: 'Note A',
				}),
			).toBe(
				'<div class="timeline-item"><br><a href="notes/a.md" class="internal-link" data-href="notes/a.md">Note A</a></div>',
			);
		});
	});

	describe('date description', () => {
		it('omits the date line when start and startLabel are missing', () => {
			const html = buildItemContentHtml({
				path: 'notes/a.md',
				title: 'Note A',
			});
			expect(html).toContain('"><br><a href=');
			expect(html).not.toContain(' - ');
		});

		it('uses start when startLabel is absent', () => {
			expect(
				buildItemContentHtml({
					path: 'notes/a.md',
					title: 'Note A',
					start: '2025-01-01',
				}),
			).toContain('>2025-01-01<br><a');
		});

		it('prefers startLabel over start', () => {
			expect(
				buildItemContentHtml({
					path: 'notes/a.md',
					title: 'Note A',
					start: '2025-01-01',
					startLabel: 'Jan 2025',
				}),
			).toContain('>Jan 2025<br><a');
		});

		it('formats a range with start and end', () => {
			expect(
				buildItemContentHtml({
					path: 'notes/a.md',
					title: 'Note A',
					start: '2025-01-01',
					end: '2025-12-31',
				}),
			).toContain('>2025-01-01 - 2025-12-31<br><a');
		});

		it('prefers endLabel over end', () => {
			expect(
				buildItemContentHtml({
					path: 'notes/a.md',
					title: 'Note A',
					start: '2025-01-01',
					end: '2025-12-31',
					endLabel: 'End of year',
				}),
			).toContain('>2025-01-01 - End of year<br><a');
		});
	});

	describe('data attributes', () => {
		it('adds data-tags from tags', () => {
			expect(
				buildItemContentHtml({
					path: 'notes/a.md',
					title: 'Note A',
					tags: ['foo', 'bar'],
				}),
			).toContain('data-tags="foo bar"');
		});

		it('adds data attributes from scalar frontmatter', () => {
			expect(
				buildItemContentHtml({
					path: 'notes/a.md',
					title: 'Note A',
					frontmatter: { status: 'done' },
				}),
			).toContain('data-status="done"');
		});

		it('serializes array and object frontmatter values', () => {
			const html = buildItemContentHtml({
				path: 'notes/a.md',
				title: 'Note A',
				frontmatter: {
					authors: ['Ada', 'Bob'],
					meta: { kind: 'event' },
				},
			});
			expect(html).toContain('data-authors="Ada Bob"');
			expect(html).toContain('data-meta="{&quot;kind&quot;:&quot;event&quot;}"');
		});

		it('skips null and undefined frontmatter values', () => {
			const html = buildItemContentHtml({
				path: 'notes/a.md',
				title: 'Note A',
				frontmatter: {
					status: 'done',
					empty: null,
					missing: undefined,
				},
			});
			expect(html).toContain('data-status="done"');
			expect(html).not.toContain('data-empty');
			expect(html).not.toContain('data-missing');
		});

		it('sanitizes frontmatter keys for data attributes', () => {
			expect(
				buildItemContentHtml({
					path: 'notes/a.md',
					title: 'Note A',
					frontmatter: { 'Status Color': 'red' },
				}),
			).toContain('data-status-color="red"');
		});
	});

	describe('html escaping', () => {
		it('escapes special characters in path, title, tags, and frontmatter', () => {
			const html = buildItemContentHtml({
				path: 'notes/"a&b".md',
				title: 'A <B> & "C"',
				tags: ['tag<"x">'],
				frontmatter: { note: 'say "hi" & <bye>' },
			});
			expect(html).toContain('href="notes/&quot;a&amp;b&quot;.md"');
			expect(html).toContain('data-href="notes/&quot;a&amp;b&quot;.md"');
			expect(html).toContain('>A &lt;B&gt; &amp; &quot;C&quot;</a>');
			expect(html).toContain('data-tags="tag&lt;&quot;x&quot;&gt;"');
			expect(html).toContain(
				'data-note="say &quot;hi&quot; &amp; &lt;bye&gt;"',
			);
		});
	});
});

describe('escapeHtml', () => {
	it('escapes amp, lt, gt, and quot', () => {
		expect(escapeHtml('a&b<c>"d"')).toBe('a&amp;b&lt;c&gt;&quot;d&quot;');
	});

	it('returns plain text unchanged', () => {
		expect(escapeHtml('hello')).toBe('hello');
	});
});
