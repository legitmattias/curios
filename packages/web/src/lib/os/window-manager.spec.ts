import { describe, it, expect, beforeEach } from 'vitest';
import { WindowManager } from './window-manager.svelte.js';
import type { AppMeta } from './types.js';

const mockApp: AppMeta = {
	id: 'test-app',
	title: 'Test App',
	icon: null as never,
	component: null as never,
	defaultWidth: 400,
	defaultHeight: 300
};

const mockApp2: AppMeta = {
	id: 'test-app-2',
	title: 'Test App 2',
	icon: null as never,
	component: null as never,
	defaultWidth: 500,
	defaultHeight: 400
};

describe('WindowManager', () => {
	let wm: WindowManager;

	beforeEach(() => {
		wm = new WindowManager();
	});

	describe('open', () => {
		it('creates a window with correct defaults', () => {
			const id = wm.open(mockApp);

			expect(wm.windows).toHaveLength(1);
			const win = wm.windows[0];
			expect(win.id).toBe(id);
			expect(win.appId).toBe('test-app');
			expect(win.title).toBe('Test App');
			expect(win.width).toBe(400);
			expect(win.height).toBe(300);
			expect(win.status).toBe('normal');
			expect(win.focused).toBe(true);
		});

		it('cascades position for multiple windows', () => {
			wm.open(mockApp);
			wm.open(mockApp);

			expect(wm.windows[1].x).toBeGreaterThan(wm.windows[0].x);
			expect(wm.windows[1].y).toBeGreaterThan(wm.windows[0].y);
		});

		it('unfocuses previous windows when opening a new one', () => {
			wm.open(mockApp);
			wm.open(mockApp2);

			expect(wm.windows[0].focused).toBe(false);
			expect(wm.windows[1].focused).toBe(true);
		});

		it('assigns increasing z-index', () => {
			wm.open(mockApp);
			wm.open(mockApp2);

			expect(wm.windows[1].zIndex).toBeGreaterThan(wm.windows[0].zIndex);
		});
	});

	describe('close', () => {
		it('removes the window', () => {
			const id = wm.open(mockApp);
			wm.close(id);

			expect(wm.windows).toHaveLength(0);
		});

		it('focuses topmost remaining window after close', () => {
			const id1 = wm.open(mockApp);
			wm.open(mockApp2);
			const id3 = wm.open(mockApp);

			wm.close(id3);

			const remaining = wm.windows.find((w) => w.id === id1);
			const other = wm.windows.find((w) => w.id !== id1);
			// The second window was the topmost before id3, so it should be focused
			expect(other?.focused).toBe(true);
			expect(remaining?.focused).toBe(false);
		});

		it('handles closing the only window', () => {
			const id = wm.open(mockApp);
			wm.close(id);

			expect(wm.windows).toHaveLength(0);
		});
	});

	describe('focus', () => {
		it('brings window to front with new z-index', () => {
			const id1 = wm.open(mockApp);
			wm.open(mockApp2);

			const oldZIndex = wm.windows.find((w) => w.id === id1)!.zIndex;
			wm.focus(id1);

			const win = wm.windows.find((w) => w.id === id1)!;
			expect(win.zIndex).toBeGreaterThan(oldZIndex);
			expect(win.focused).toBe(true);
		});

		it('unfocuses other windows', () => {
			const id1 = wm.open(mockApp);
			const id2 = wm.open(mockApp2);
			wm.focus(id1);

			const win2 = wm.windows.find((w) => w.id === id2)!;
			expect(win2.focused).toBe(false);
		});

		it('does nothing if already focused', () => {
			wm.open(mockApp);
			const id2 = wm.open(mockApp2);

			const zBefore = wm.windows.find((w) => w.id === id2)!.zIndex;
			wm.focus(id2);

			// Should not change z-index since it's already focused
			expect(wm.windows.find((w) => w.id === id2)!.zIndex).toBe(zBefore);
		});
	});

	describe('minimize', () => {
		it('sets status to minimized', () => {
			const id = wm.open(mockApp);
			wm.minimize(id);

			expect(wm.windows[0].status).toBe('minimized');
			expect(wm.windows[0].focused).toBe(false);
		});

		it('focuses next topmost visible window', () => {
			wm.open(mockApp);
			const id2 = wm.open(mockApp2);
			wm.minimize(id2);

			expect(wm.windows[0].focused).toBe(true);
		});

		it('is a no-op if already minimized', () => {
			const id = wm.open(mockApp);
			wm.minimize(id);
			wm.minimize(id);

			expect(wm.windows[0].status).toBe('minimized');
		});
	});

	describe('maximize', () => {
		it('fills the viewport', () => {
			const id = wm.open(mockApp);
			wm.maximize(id, 1920, 1032);

			const win = wm.windows[0];
			expect(win.x).toBe(0);
			expect(win.y).toBe(0);
			expect(win.width).toBe(1920);
			expect(win.height).toBe(1032);
			expect(win.status).toBe('maximized');
		});

		it('saves the previous rect for restore', () => {
			const id = wm.open(mockApp);
			const origX = wm.windows[0].x;
			const origY = wm.windows[0].y;

			wm.maximize(id, 1920, 1032);
			wm.restore(id);

			const win = wm.windows[0];
			expect(win.x).toBe(origX);
			expect(win.y).toBe(origY);
			expect(win.width).toBe(400);
			expect(win.height).toBe(300);
			expect(win.status).toBe('normal');
		});

		it('toggles: calling maximize on a maximized window restores it', () => {
			const id = wm.open(mockApp);
			wm.maximize(id, 1920, 1032);
			wm.maximize(id, 1920, 1032);

			expect(wm.windows[0].status).toBe('normal');
		});
	});

	describe('restore', () => {
		it('restores a minimized window to normal', () => {
			const id = wm.open(mockApp);
			wm.minimize(id);
			wm.restore(id);

			expect(wm.windows[0].status).toBe('normal');
			expect(wm.windows[0].focused).toBe(true);
		});

		it('restores a maximized window to saved rect', () => {
			const id = wm.open(mockApp);
			const origWidth = wm.windows[0].width;

			wm.maximize(id, 1920, 1032);
			wm.restore(id);

			expect(wm.windows[0].width).toBe(origWidth);
			expect(wm.windows[0].status).toBe('normal');
		});
	});

	describe('move', () => {
		it('updates x and y', () => {
			const id = wm.open(mockApp);
			wm.move(id, 200, 300);

			expect(wm.windows[0].x).toBe(200);
			expect(wm.windows[0].y).toBe(300);
		});
	});

	describe('setRect', () => {
		it('updates position and size', () => {
			const id = wm.open(mockApp);
			wm.setRect(id, 100, 100, 600, 500);

			const win = wm.windows[0];
			expect(win.x).toBe(100);
			expect(win.y).toBe(100);
			expect(win.width).toBe(600);
			expect(win.height).toBe(500);
		});

		it('clamps to minimum size', () => {
			const id = wm.open(mockApp);
			wm.setRect(id, 0, 0, 50, 50);

			expect(wm.windows[0].width).toBe(200);
			expect(wm.windows[0].height).toBe(150);
		});
	});

	describe('handleTaskbarClick', () => {
		it('restores a minimized window', () => {
			const id = wm.open(mockApp);
			wm.minimize(id);
			wm.handleTaskbarClick(id);

			expect(wm.windows[0].status).toBe('normal');
			expect(wm.windows[0].focused).toBe(true);
		});

		it('minimizes a focused window', () => {
			const id = wm.open(mockApp);
			wm.handleTaskbarClick(id);

			expect(wm.windows[0].status).toBe('minimized');
		});

		it('focuses an unfocused window', () => {
			const id1 = wm.open(mockApp);
			wm.open(mockApp2);

			wm.handleTaskbarClick(id1);

			expect(wm.windows.find((w) => w.id === id1)!.focused).toBe(true);
		});
	});

	describe('visibleWindows', () => {
		it('excludes minimized windows', () => {
			const id1 = wm.open(mockApp);
			wm.open(mockApp2);
			wm.minimize(id1);

			expect(wm.visibleWindows).toHaveLength(1);
			expect(wm.visibleWindows[0].appId).toBe('test-app-2');
		});

		it('returns windows sorted by z-index ascending', () => {
			const id1 = wm.open(mockApp);
			wm.open(mockApp2);
			wm.focus(id1);

			expect(wm.visibleWindows[0].appId).toBe('test-app-2');
			expect(wm.visibleWindows[1].appId).toBe('test-app');
		});
	});

	describe('focusedId', () => {
		it('returns the focused window id', () => {
			const id = wm.open(mockApp);
			expect(wm.focusedId).toBe(id);
		});

		it('returns null when no windows', () => {
			expect(wm.focusedId).toBeNull();
		});
	});
});
