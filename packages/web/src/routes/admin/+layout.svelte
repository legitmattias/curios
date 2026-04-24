<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Tooltip from '$lib/admin/components/Tooltip.svelte';
	import KbdHint from '$lib/admin/components/KbdHint.svelte';
	import ConfirmModal from '$lib/admin/components/ConfirmModal.svelte';

	let { data, children } = $props();

	// G-prefix navigation shortcuts (press G, then a key within 1s).
	// Pattern: Linear / GitHub / Superhuman. The badges in the nav advertise them.
	type AdminRoute =
		| '/admin'
		| '/admin/projects'
		| '/admin/skills'
		| '/admin/experience'
		| '/admin/education'
		| '/admin/profile'
		| '/admin/cv-skills'
		| '/admin/cv-projects'
		| '/admin/sync';
	const goShortcuts: Record<string, AdminRoute> = {
		d: '/admin',
		p: '/admin/projects',
		k: '/admin/skills',
		x: '/admin/experience',
		e: '/admin/education',
		r: '/admin/profile',
		c: '/admin/cv-skills',
		v: '/admin/cv-projects',
		s: '/admin/sync'
	};
	let gPending = false;
	let gTimer: ReturnType<typeof setTimeout> | undefined;

	// Don't render the admin shell on the login page — it has its own centered layout.
	const isLogin = $derived(page.url.pathname === '/admin/login');

	// ── Navigation ──
	const navSections = [
		{
			heading: 'Overview',
			items: [{ label: 'Dashboard', href: '/admin', kbd: 'G D' }]
		},
		{
			heading: 'Data',
			items: [
				{ label: 'Projects', href: '/admin/projects', kbd: 'G P' },
				{ label: 'Skills', href: '/admin/skills', kbd: 'G K' },
				{ label: 'Experience', href: '/admin/experience', kbd: 'G X' },
				{ label: 'Education', href: '/admin/education', kbd: 'G E' },
				{ label: 'Profile', href: '/admin/profile', kbd: 'G R' }
			]
		},
		{
			heading: 'Generated',
			items: [
				{ label: 'CV skills', href: '/admin/cv-skills', kbd: 'G C' },
				{ label: 'CV projects', href: '/admin/cv-projects', kbd: 'G V' }
			]
		},
		{
			heading: 'Actions',
			items: [{ label: 'Sync', href: '/admin/sync', kbd: 'G S' }]
		}
	] as const;

	// ── Sidebar state (mobile drawer + desktop collapse) ──
	let sidebarOpen = $state(false); // mobile
	let sidebarCollapsed = $state(false); // desktop icon-rail
	let logoutOpen = $state(false);
	let cmdkOpen = $state(false);

	function toggleSidebarMobile() {
		sidebarOpen = !sidebarOpen;
	}

	function toggleSidebarDesktop() {
		sidebarCollapsed = !sidebarCollapsed;
	}

	function handleKeydown(e: KeyboardEvent) {
		// Don't hijack typing in inputs.
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

		// Modifier-keyed shortcut: open command palette.
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			cmdkOpen = true;
			return;
		}

		// Ignore plain letters if any modifier is held.
		if (e.ctrlKey || e.metaKey || e.altKey) return;

		const key = e.key.toLowerCase();

		// Start of a G-prefix sequence.
		if (!gPending && key === 'g') {
			gPending = true;
			if (gTimer) clearTimeout(gTimer);
			gTimer = setTimeout(() => (gPending = false), 1000);
			return;
		}

		// Second key of a G-prefix sequence.
		if (gPending) {
			gPending = false;
			if (gTimer) clearTimeout(gTimer);
			const target = goShortcuts[key];
			if (target) {
				e.preventDefault();
				void goto(resolve(target));
			}
		}
	}

	// ── Breadcrumb ──
	const crumbMap: Record<string, string[]> = {
		'/admin': ['Dashboard'],
		'/admin/projects': ['Data', 'Projects'],
		'/admin/skills': ['Data', 'Skills'],
		'/admin/experience': ['Data', 'Experience'],
		'/admin/education': ['Data', 'Education'],
		'/admin/profile': ['Data', 'Profile'],
		'/admin/cv-skills': ['Generated', 'CV skills'],
		'/admin/cv-projects': ['Generated', 'CV projects'],
		'/admin/sync': ['Actions', 'Sync']
	};
	const crumb = $derived.by(() => {
		const path = page.url.pathname;
		if (crumbMap[path]) return crumbMap[path];
		// Sub-routes (e.g. /admin/projects/[slug]) — fall back to generic split
		return [path.replace('/admin/', '').split('/').join(' / ')];
	});

	async function doLogout() {
		const res = await fetch('/admin/logout', { method: 'POST', redirect: 'follow' });
		// Server issues a 303 back to /admin/login; follow it.
		window.location.href = res.url || '/admin/login';
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isLogin}
	{@render children()}
{:else if data.authed}
	<div class="admin-shell" class:sidebar-collapsed={sidebarCollapsed}>
		<!-- Sidebar -->
		<aside class="sidebar" class:open={sidebarOpen} aria-label="Admin navigation">
			<div class="side-head">
				<div class="brand">
					<span class="wordmark">CuriOS</span>
					<span class="sub">ADMIN</span>
				</div>
				<Tooltip label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
					<button
						class="icon-btn desktop-only"
						onclick={toggleSidebarDesktop}
						aria-label="Toggle sidebar width"
					>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</svg>
					</button>
				</Tooltip>
			</div>

			<nav>
				{#each navSections as section (section.heading)}
					<div class="nav-section">
						<div class="nav-heading">{section.heading}</div>
						<ul>
							{#each section.items as item (item.href)}
								{@const active = page.url.pathname === item.href}
								<li>
									<Tooltip label={sidebarCollapsed ? item.label : ''} side="right">
										<a
											href={resolve(item.href)}
											class="nav-item"
											class:active
											onclick={() => (sidebarOpen = false)}
										>
											<span class="nav-label">{item.label}</span>
											<span class="nav-kbd">
												<KbdHint keys={item.kbd} compact />
											</span>
										</a>
									</Tooltip>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</nav>

			<div class="side-foot">
				<Tooltip label="Sign out and return to the login screen" side="right">
					<button class="logout" onclick={() => (logoutOpen = true)}>
						<span>Sign out</span>
					</button>
				</Tooltip>
			</div>
		</aside>

		{#if sidebarOpen}
			<button
				type="button"
				class="scrim"
				onclick={() => (sidebarOpen = false)}
				aria-label="Close navigation"
			></button>
		{/if}

		<!-- Top bar -->
		<header class="topbar">
			<button
				class="icon-btn mobile-only"
				onclick={toggleSidebarMobile}
				aria-label="Open navigation"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="3" y1="12" x2="21" y2="12" />
					<line x1="3" y1="6" x2="21" y2="6" />
					<line x1="3" y1="18" x2="21" y2="18" />
				</svg>
			</button>

			<div class="crumb">
				{#each crumb as part, i (i)}
					<span>{part}</span>
					{#if i < crumb.length - 1}
						<span class="crumb-sep">/</span>
					{/if}
				{/each}
			</div>

			<div class="topbar-spacer"></div>

			<Tooltip label="Command palette">
				<button class="cmdk" onclick={() => (cmdkOpen = true)}>
					<span>Search</span>
					<KbdHint keys={['⌘', 'K']} compact />
				</button>
			</Tooltip>
		</header>

		<!-- Main -->
		<main class="main">
			{@render children()}
		</main>
	</div>

	<!-- Logout confirm -->
	<ConfirmModal
		bind:open={logoutOpen}
		title="Sign out of admin?"
		message="You'll be returned to the login screen. Unsaved actions in flight will continue on the server."
		confirmLabel="Sign out"
		onconfirm={doLogout}
	/>

	<!-- Command palette (Phase 2 wires this up) -->
	<ConfirmModal
		bind:open={cmdkOpen}
		title="Command palette"
		message="Coming soon — Phase 2. Ctrl/⌘+K will open a fuzzy search over actions and navigation."
		confirmLabel="OK"
		cancelLabel="Close"
		onconfirm={() => {}}
	/>
{/if}

<style>
	.admin-shell {
		display: grid;
		grid-template-columns: 220px 1fr;
		grid-template-rows: 44px 1fr;
		grid-template-areas:
			'sidebar topbar'
			'sidebar main';
		min-height: 100vh;
		background: var(--color-desktop-bg);
		color: var(--color-text-primary);
		transition: grid-template-columns var(--transition-fast);
	}

	.admin-shell.sidebar-collapsed {
		grid-template-columns: 52px 1fr;
	}

	.sidebar {
		grid-area: sidebar;
		display: flex;
		flex-direction: column;
		background: var(--color-window-bg);
		border-right: 1px solid var(--color-explorer-border);
		overflow-y: auto;
		overflow-x: hidden;
	}

	.side-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 44px;
		padding: 0 var(--space-3);
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.brand {
		display: flex;
		align-items: baseline;
		gap: 6px;
		overflow: hidden;
		white-space: nowrap;
	}

	.wordmark {
		font-size: 13px;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: var(--color-text-primary);
	}

	.sub {
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 9.5px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-accent);
	}

	.admin-shell.sidebar-collapsed .brand {
		visibility: hidden;
	}

	nav {
		flex: 1;
		padding: var(--space-3) 0;
	}

	.nav-section {
		margin-bottom: var(--space-4);
	}

	.nav-heading {
		padding: 0 var(--space-3);
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 9.5px;
		font-weight: 600;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-bottom: 6px;
	}

	.admin-shell.sidebar-collapsed .nav-heading {
		visibility: hidden;
		height: 14px;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.nav-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: 7px var(--space-3);
		font-size: 12.5px;
		color: var(--color-text-secondary);
		text-decoration: none;
		border-left: 2px solid transparent;
		transition:
			color var(--transition-fast),
			background var(--transition-fast),
			border-color var(--transition-fast);
	}

	.nav-item:hover {
		color: var(--color-text-primary);
		background: var(--color-explorer-item-hover);
	}

	.nav-item.active {
		color: var(--color-text-primary);
		background: var(--color-explorer-item-active);
		border-left-color: var(--color-accent);
	}

	.admin-shell.sidebar-collapsed .nav-label,
	.admin-shell.sidebar-collapsed .nav-kbd {
		display: none;
	}

	.side-foot {
		padding: var(--space-3);
		border-top: 1px solid var(--color-explorer-border);
	}

	.logout {
		width: 100%;
		text-align: left;
		padding: 6px 8px;
		font-size: 12px;
		font-family: inherit;
		color: var(--color-text-secondary);
		background: transparent;
		border: 1px dashed var(--color-explorer-border);
		border-radius: 3px;
		cursor: pointer;
		transition:
			color var(--transition-fast),
			border-color var(--transition-fast);
	}

	.logout:hover {
		color: var(--color-text-primary);
		border-style: solid;
	}

	.admin-shell.sidebar-collapsed .logout span {
		display: none;
	}

	.admin-shell.sidebar-collapsed .logout::before {
		content: '→';
	}

	.topbar {
		grid-area: topbar;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0 var(--space-3);
		background: var(--color-window-bg);
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		color: var(--color-text-muted);
		background: transparent;
		border: 1px solid transparent;
		border-radius: 3px;
		cursor: pointer;
		transition:
			color var(--transition-fast),
			border-color var(--transition-fast);
	}

	.icon-btn:hover {
		color: var(--color-text-primary);
		border-color: var(--color-explorer-border);
	}

	.crumb {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family:
			ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Mono', Menlo, Consolas, monospace;
		font-size: 11.5px;
		color: var(--color-text-secondary);
	}

	.crumb-sep {
		color: var(--color-text-muted);
	}

	.topbar-spacer {
		flex: 1;
	}

	.cmdk {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 26px;
		padding: 0 8px;
		font-family: inherit;
		font-size: 11.5px;
		color: var(--color-text-muted);
		background: transparent;
		border: 1px solid var(--color-explorer-border);
		border-radius: 3px;
		cursor: pointer;
		transition:
			color var(--transition-fast),
			border-color var(--transition-fast);
	}

	.cmdk:hover {
		color: var(--color-text-primary);
		border-color: var(--color-accent);
	}

	.main {
		grid-area: main;
		overflow-y: auto;
		padding: var(--space-4);
	}

	.scrim {
		display: none;
	}

	.desktop-only {
		display: inline-flex;
	}

	.mobile-only {
		display: none;
	}

	@media (max-width: 720px) {
		.admin-shell {
			grid-template-columns: 0 1fr;
			grid-template-areas:
				'topbar topbar'
				'main main';
		}

		.sidebar {
			position: fixed;
			inset: 0 auto 0 0;
			width: 240px;
			z-index: 10020;
			transform: translateX(-100%);
			transition: transform var(--transition-fast);
		}

		.sidebar.open {
			transform: translateX(0);
		}

		.scrim {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.4);
			z-index: 10015;
			border: none;
			cursor: default;
		}

		.desktop-only {
			display: none;
		}

		.mobile-only {
			display: inline-flex;
		}

		.cmdk span {
			display: none;
		}
	}
</style>
