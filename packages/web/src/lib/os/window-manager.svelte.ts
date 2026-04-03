import { SvelteMap } from 'svelte/reactivity';
import type { AppMeta, SavedRect, WindowState } from './types.js';

const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;
const CASCADE_OFFSET = 30;
const INITIAL_X = 80;
const INITIAL_Y = 40;

export class WindowManager {
	windows = $state<WindowState[]>([]);
	private nextZIndex = 1;
	private restoredRects = new SvelteMap<string, SavedRect>();
	private preMinimizeStatus = new SvelteMap<string, 'normal' | 'maximized'>();
	private openCount = 0;

	get visibleWindows(): WindowState[] {
		return this.windows
			.filter((w) => w.status !== 'minimized')
			.toSorted((a, b) => a.zIndex - b.zIndex);
	}

	get focusedId(): string | null {
		const focused = this.windows.find((w) => w.focused);
		return focused?.id ?? null;
	}

	open(app: AppMeta): string {
		const id = crypto.randomUUID();
		const offset = (this.openCount % 8) * CASCADE_OFFSET;
		this.openCount++;

		const win: WindowState = {
			id,
			appId: app.id,
			title: app.title,
			x: INITIAL_X + offset,
			y: INITIAL_Y + offset,
			width: app.defaultWidth,
			height: app.defaultHeight,
			zIndex: this.nextZIndex++,
			status: 'normal',
			focused: true
		};

		// Unfocus all others
		for (const w of this.windows) {
			w.focused = false;
		}

		this.windows.push(win);
		return id;
	}

	close(id: string): void {
		this.windows = this.windows.filter((w) => w.id !== id);
		this.restoredRects.delete(id);
		this.preMinimizeStatus.delete(id);

		// Focus the topmost remaining window
		if (this.windows.length > 0) {
			const topmost = this.windows.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
			this.focusWindow(topmost);
		}
	}

	focus(id: string): void {
		const win = this.findWindow(id);
		if (!win || win.focused) return;
		this.focusWindow(win);
	}

	minimize(id: string): void {
		const win = this.findWindow(id);
		if (!win || win.status === 'minimized') return;

		this.preMinimizeStatus.set(id, win.status as 'normal' | 'maximized');
		win.status = 'minimized';
		win.focused = false;

		// Focus the topmost non-minimized window
		const visible = this.windows.filter((w) => w.status !== 'minimized');
		if (visible.length > 0) {
			const topmost = visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b));
			this.focusWindow(topmost);
		}
	}

	maximize(id: string, viewportWidth: number, viewportHeight: number): void {
		const win = this.findWindow(id);
		if (!win) return;

		if (win.status === 'maximized') {
			this.restore(id);
			return;
		}

		// Save current rect for restore
		this.restoredRects.set(id, {
			x: win.x,
			y: win.y,
			width: win.width,
			height: win.height
		});

		win.x = 0;
		win.y = 0;
		win.width = viewportWidth;
		win.height = viewportHeight;
		win.status = 'maximized';
		this.focusWindow(win);
	}

	restore(id: string): void {
		const win = this.findWindow(id);
		if (!win) return;

		if (win.status === 'minimized') {
			win.status = this.preMinimizeStatus.get(id) ?? 'normal';
			this.preMinimizeStatus.delete(id);
			this.focusWindow(win);
			return;
		}

		if (win.status === 'maximized') {
			const saved = this.restoredRects.get(id);
			if (saved) {
				win.x = saved.x;
				win.y = saved.y;
				win.width = saved.width;
				win.height = saved.height;
				this.restoredRects.delete(id);
			}
			win.status = 'normal';
			this.focusWindow(win);
		}
	}

	move(id: string, x: number, y: number): void {
		const win = this.findWindow(id);
		if (!win) return;
		win.x = x;
		win.y = y;
	}

	setRect(id: string, x: number, y: number, width: number, height: number): void {
		const win = this.findWindow(id);
		if (!win) return;
		win.x = x;
		win.y = y;
		win.width = Math.max(width, MIN_WIDTH);
		win.height = Math.max(height, MIN_HEIGHT);
	}

	/** Handle taskbar entry click: toggle minimize/focus */
	handleTaskbarClick(id: string): void {
		const win = this.findWindow(id);
		if (!win) return;

		if (win.status === 'minimized') {
			this.restore(id);
		} else if (win.focused) {
			this.minimize(id);
		} else {
			this.focus(id);
		}
	}

	private findWindow(id: string): WindowState | undefined {
		return this.windows.find((w) => w.id === id);
	}

	private focusWindow(win: WindowState): void {
		for (const w of this.windows) {
			w.focused = false;
		}
		win.focused = true;
		win.zIndex = this.nextZIndex++;
	}
}

export const windowManager = new WindowManager();
