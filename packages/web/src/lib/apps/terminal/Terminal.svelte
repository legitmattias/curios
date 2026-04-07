<script lang="ts">
	import { untrack } from 'svelte';
	import { command, error, system, type OutputLine } from './output.js';
	import { getCommand, findCompletions } from './commands.js';

	const PROMPT = 'visitor@curios:~$ ';

	let outputLines = $state<OutputLine[]>([]);
	let inputValue = $state('');
	let commandHistory = $state<string[]>([]);
	let historyIndex = $state(-1);
	let isRunning = $state(false);

	let outputEl: HTMLDivElement;
	let inputEl: HTMLInputElement;

	function scrollToBottom() {
		requestAnimationFrame(() => {
			if (outputEl) outputEl.scrollTop = outputEl.scrollHeight;
		});
	}

	function appendLines(lines: OutputLine[]) {
		outputLines = [...outputLines, ...lines];
		scrollToBottom();
	}

	async function executeCommand(input: string) {
		const trimmed = input.trim();
		if (!trimmed) return;

		appendLines([command(`${PROMPT}${trimmed}`)]);
		commandHistory = [...commandHistory, trimmed];
		historyIndex = -1;

		const [cmdName, ...args] = trimmed.split(/\s+/);
		const cmd = getCommand(cmdName);

		if (!cmd) {
			appendLines([
				error(`command not found: ${cmdName}`),
				system('Type "help" for available commands.')
			]);
			return;
		}

		if (cmd.name === 'clear') {
			outputLines = [];
			return;
		}

		isRunning = true;
		try {
			const result = await cmd.handler(args);
			appendLines(result);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Unknown error';
			appendLines([error(msg)]);
		} finally {
			isRunning = false;
			requestAnimationFrame(() => focusInput());
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			const val = inputValue;
			inputValue = '';
			executeCommand(val);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (commandHistory.length === 0) return;
			if (historyIndex === -1) {
				historyIndex = commandHistory.length - 1;
			} else if (historyIndex > 0) {
				historyIndex--;
			}
			inputValue = commandHistory[historyIndex];
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (historyIndex === -1) return;
			if (historyIndex < commandHistory.length - 1) {
				historyIndex++;
				inputValue = commandHistory[historyIndex];
			} else {
				historyIndex = -1;
				inputValue = '';
			}
		} else if (e.key === 'Tab') {
			e.preventDefault();
			const matches = findCompletions(inputValue);
			if (matches.length === 1) {
				inputValue = matches[0] + ' ';
			} else if (matches.length > 1) {
				appendLines([command(`${PROMPT}${inputValue}`), system(matches.join('  '))]);
			}
		}
	}

	function focusInput() {
		inputEl?.focus();
	}

	// Welcome banner + focus on mount (untrack prevents re-triggering)
	$effect(() => {
		untrack(() => {
			appendLines([
				system('Welcome to CuriOS Terminal v0.1.0'),
				system('Type "help" to see available commands.'),
				system('')
			]);
			focusInput();
		});
	});
</script>

<div
	class="terminal"
	role="application"
	aria-label="Terminal"
	tabindex="-1"
	onpointerdown={focusInput}
>
	<div class="output" bind:this={outputEl} aria-live="polite" aria-relevant="additions">
		{#each outputLines as line (line.id)}
			<pre class="line {line.type}">{line.text}</pre>
		{/each}
	</div>

	<div class="input-row">
		<span class="prompt">{PROMPT}</span>
		<input
			bind:this={inputEl}
			bind:value={inputValue}
			onkeydown={handleKeydown}
			class="input"
			type="text"
			spellcheck="false"
			autocomplete="off"
			autocapitalize="off"
			disabled={isRunning}
		/>
	</div>
</div>

<style>
	.terminal {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: var(--color-terminal-bg);
		font-family: var(--font-mono);
		font-size: 0.8rem;
		line-height: 1.5;
		cursor: text;
	}

	.output {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-2) var(--space-3);
		min-height: 0;
	}

	.line {
		margin: 0;
		font-family: inherit;
		font-size: inherit;
		white-space: pre-wrap;
		word-break: break-all;
	}

	.line.command {
		color: var(--color-terminal-prompt);
	}

	.line.stdout {
		color: var(--color-terminal-text);
	}

	.line.error {
		color: var(--color-control-close);
	}

	.line.system {
		color: var(--color-terminal-system);
	}

	.input-row {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: 0 var(--space-3) var(--space-2);
		flex-shrink: 0;
	}

	.prompt {
		color: var(--color-terminal-prompt);
		flex-shrink: 0;
		user-select: none;
	}

	.input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		color: var(--color-terminal-text);
		font-family: inherit;
		font-size: inherit;
		caret-color: var(--color-terminal-cursor);
		padding: 0;
	}

	.input:disabled {
		opacity: 0.5;
	}
</style>
