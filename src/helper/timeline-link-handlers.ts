import type { App } from 'obsidian';
import { logger } from './logger';

const HOVER_LINK_SOURCE = 'bases-timeline-view';

/**
 * Attach Obsidian internal-link click + Page Preview hover on a timeline container.
 * Returns a detach function for cleanup / re-attach.
 */
export function attachTimelineLinkHandlers(
	containerEl: HTMLElement,
	app: App,
	hoverParent: unknown,
): () => void {
	const onClick = (e: MouseEvent) => {
		const target = e.target as HTMLElement;
		const link = target.closest('a.internal-link') as HTMLAnchorElement | null;
		const href = link?.getAttribute('href');

		if (!link || !href) {
			return;
		}

		e.stopPropagation();
		e.preventDefault();
		app.workspace.openLinkText(href, '', 'tab').catch((error) => {
			logger.error(error);
		});
	};

	const onMouseOver = (evt: MouseEvent) => {
		const link = (evt.target as HTMLElement).closest('a.internal-link');
		if (!link) {
			return;
		}
		evt.stopPropagation();
		app.workspace.trigger('hover-link', {
			event: evt,
			source: HOVER_LINK_SOURCE,
			hoverParent,
			targetEl: link as HTMLElement,
			linktext:
				link.getAttribute('data-href') || link.getAttribute('href') || '',
			sourcePath: '',
		});
	};

	containerEl.addEventListener('click', onClick);
	containerEl.addEventListener('mouseover', onMouseOver);

	return () => {
		containerEl.removeEventListener('click', onClick);
		containerEl.removeEventListener('mouseover', onMouseOver);
	};
}

/** Track last detach per container for API re-render. */
const detachByContainer = new WeakMap<HTMLElement, () => void>();

/**
 * Detach any previous handlers on the container, then attach fresh ones.
 */
export function reattachTimelineLinkHandlers(
	containerEl: HTMLElement,
	app: App,
	hoverParent: unknown,
): void {
	detachByContainer.get(containerEl)?.();
	const detach = attachTimelineLinkHandlers(containerEl, app, hoverParent);
	detachByContainer.set(containerEl, detach);
}
