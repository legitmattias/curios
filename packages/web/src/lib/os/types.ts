import type { Component } from 'svelte';

/** The runtime state of a single open window */
export interface WindowState {
	id: string;
	appId: string;
	title: string;
	x: number;
	y: number;
	width: number;
	height: number;
	zIndex: number;
	status: 'normal' | 'minimized' | 'maximized';
	focused: boolean;
}

/** Metadata describing a registered app */
export interface AppMeta {
	id: string;
	title: string;
	icon: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	component: Component<any>;
	defaultWidth: number;
	defaultHeight: number;
}

/** Saved position/size for maximize/restore round-trip */
export interface SavedRect {
	x: number;
	y: number;
	width: number;
	height: number;
}
