<script lang="ts">
	import '$lib/styles/global.css';
	import { profileStore } from '$lib/os/profile-store.svelte.js';
	import { localeStore } from '$lib/os/locale-store.svelte.js';

	let { children } = $props();

	// Load the profile once on mount and re-fetch when locale changes.
	$effect(() => {
		void profileStore.load(localeStore.current);
	});
</script>

{@render children()}
