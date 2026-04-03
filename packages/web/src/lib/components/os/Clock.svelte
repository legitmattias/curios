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
		font-size: var(--text-sm);
		font-family: var(--font-mono);
		color: var(--color-text-primary);
		opacity: 0.7;
		padding: 0 var(--space-3);
		user-select: none;
	}
</style>
