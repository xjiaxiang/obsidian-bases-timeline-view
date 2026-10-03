import type { Plugin } from 'obsidian';
import {
	CUSTOM_RENDER_TEMPLATE,
	DATAVIEW_RENDER_TEMPLATE,
} from './templates';

export function registerCommands(plugin: Plugin) {
	plugin.addCommand({
		id: 'insert-custom-render-template',
		name: 'Insert custom render template',
		editorCallback: (editor) => {
			editor.replaceSelection(CUSTOM_RENDER_TEMPLATE);
		},
	});

	plugin.addCommand({
		id: 'insert-dataview-render-template',
		name: 'Insert Dataview render template',
		editorCallback: (editor) => {
			editor.replaceSelection(DATAVIEW_RENDER_TEMPLATE);
		},
	});
}
