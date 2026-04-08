import type { AppMeta } from './types.js';
import FileExplorer from '$lib/apps/file-explorer/FileExplorer.svelte';
import Terminal from '$lib/apps/terminal/Terminal.svelte';
import SystemMonitor from '$lib/apps/system-monitor/SystemMonitor.svelte';
import IconFiles from '$lib/components/icons/IconFiles.svelte';
import IconTerminal from '$lib/components/icons/IconTerminal.svelte';
import IconMonitor from '$lib/components/icons/IconMonitor.svelte';
import DocumentViewer from '$lib/apps/document-viewer/DocumentViewer.svelte';
import IconDocument from '$lib/components/icons/IconDocument.svelte';
import Settings from '$lib/apps/settings/Settings.svelte';
import IconSettings from '$lib/components/icons/IconSettings.svelte';

export const APP_REGISTRY: Record<string, AppMeta> = {
	files: {
		id: 'files',
		title: 'app.fileExplorer',
		icon: IconFiles,
		component: FileExplorer,
		defaultWidth: 750,
		defaultHeight: 520
	},
	terminal: {
		id: 'terminal',
		title: 'app.terminal',
		icon: IconTerminal,
		component: Terminal,
		defaultWidth: 640,
		defaultHeight: 420
	},
	'system-monitor': {
		id: 'system-monitor',
		title: 'app.systemMonitor',
		icon: IconMonitor,
		component: SystemMonitor,
		defaultWidth: 820,
		defaultHeight: 540
	},
	'document-viewer': {
		id: 'document-viewer',
		title: 'app.documents',
		icon: IconDocument,
		component: DocumentViewer,
		defaultWidth: 680,
		defaultHeight: 560
	},
	settings: {
		id: 'settings',
		title: 'app.settings',
		icon: IconSettings,
		component: Settings,
		defaultWidth: 550,
		defaultHeight: 420
	}
};

export function getApp(id: string): AppMeta | undefined {
	return APP_REGISTRY[id];
}

export function getAllApps(): AppMeta[] {
	return Object.values(APP_REGISTRY);
}
