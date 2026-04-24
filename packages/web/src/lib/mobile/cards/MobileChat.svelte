<script lang="ts">
	import Chat from '$lib/apps/chat/Chat.svelte';
</script>

<div class="mobile-chat-scope">
	<Chat />
</div>

<style>
	.mobile-chat-scope {
		display: flex;
		flex-direction: column;
		height: 100%;
		padding-bottom: env(safe-area-inset-bottom);
	}

	/* Bump the input font-size to 16px on mobile so iOS Safari doesn't zoom
	   the viewport when the user focuses the chat input. */
	.mobile-chat-scope :global(.chat-input) {
		font-size: 16px;
	}
</style>
