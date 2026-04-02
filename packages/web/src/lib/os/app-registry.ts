import type { AppMeta } from './types.js';
import PlaceholderApp from '$lib/apps/placeholder/PlaceholderApp.svelte';

export const APP_REGISTRY: Record<string, AppMeta> = {
	files: {
		id: 'files',
		title: 'File Explorer',
		icon: '📁',
		component: PlaceholderApp,
		defaultWidth: 700,
		defaultHeight: 500
	},
	terminal: {
		id: 'terminal',
		title: 'Terminal',
		icon: '🖥',
		component: PlaceholderApp,
		defaultWidth: 640,
		defaultHeight: 420
	}
};

export function getApp(id: string): AppMeta | undefined {
	return APP_REGISTRY[id];
}

export function getAllApps(): AppMeta[] {
	return Object.values(APP_REGISTRY);
}
