<script lang="ts">
	let time = $state('');

	function updateTime() {
		const now = new Date();
		time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}

	$effect(() => {
		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	});
</script>

<span class="clock">{time}</span>

<style>
	.clock {
		font-size: 0.8rem;
		font-family: var(--font-mono);
		color: var(--color-text-secondary);
		padding: 0 var(--space-3);
		user-select: none;
	}
</style>
