<script lang="ts">
	import '$lib/styles/global.css';
	import favicon from '$lib/assets/favicon.svg';
	import { profileStore } from '$lib/os/profile-store.svelte.js';
	import { localeStore } from '$lib/os/locale-store.svelte.js';

	let { children } = $props();

	// Load the profile once on mount and re-fetch when locale changes.
	$effect(() => {
		void profileStore.load(localeStore.current);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
