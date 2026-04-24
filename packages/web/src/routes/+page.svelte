<script lang="ts">
	import Desktop from '$lib/components/os/Desktop.svelte';
	import MobileShell from '$lib/mobile/MobileShell.svelte';

	let { data } = $props();
</script>

{#if data.shell === 'mobile'}
	<MobileShell />
{:else}
	<Desktop />
{/if}
