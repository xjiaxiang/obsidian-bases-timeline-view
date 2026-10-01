export const logger: Record<string, (...args: any[]) => void> = {
	error: console.error.bind(console, '[TimelineView]'),
	warn: console.warn.bind(console, '[TimelineView]'),
	debug: console.info.bind(console, '[TimelineView]'),
};
