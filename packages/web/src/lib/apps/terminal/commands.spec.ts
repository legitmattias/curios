import { describe, it, expect } from 'vitest';
import { getCommand, getCommandNames, findCompletions } from './commands.js';

describe('getCommand', () => {
	it('returns a command by name', () => {
		const cmd = getCommand('help');
		expect(cmd).toBeDefined();
		expect(cmd?.name).toBe('help');
		expect(cmd?.description).toBeTruthy();
	});

	it('returns undefined for unknown command', () => {
		expect(getCommand('nonexistent')).toBeUndefined();
	});

	it('has all expected commands', () => {
		const expected = [
			'help',
			'clear',
			'status',
			'projects',
			'project',
			'skills',
			'experience',
			'about',
			'contact',
			'neofetch',
			'echo',
			'cv',
			'theme',
			'whoami'
		];
		for (const name of expected) {
			expect(getCommand(name), `missing command: ${name}`).toBeDefined();
		}
	});
});

describe('getCommandNames', () => {
	it('returns an array of strings', () => {
		const names = getCommandNames();
		expect(Array.isArray(names)).toBe(true);
		expect(names.length).toBeGreaterThan(0);
		expect(names.every((n) => typeof n === 'string')).toBe(true);
	});

	it('includes help and clear', () => {
		const names = getCommandNames();
		expect(names).toContain('help');
		expect(names).toContain('clear');
	});
});

describe('findCompletions', () => {
	it('returns matching commands for a prefix', () => {
		const matches = findCompletions('he');
		expect(matches).toContain('help');
	});

	it('returns multiple matches for ambiguous prefix', () => {
		const matches = findCompletions('s');
		expect(matches).toContain('status');
		expect(matches).toContain('skills');
	});

	it('returns empty array for no match', () => {
		expect(findCompletions('zzz')).toEqual([]);
	});

	it('returns empty array for empty string', () => {
		expect(findCompletions('')).toEqual([]);
	});
});

describe('command handlers', () => {
	it('help returns output lines', async () => {
		const cmd = getCommand('help')!;
		const lines = await cmd.handler([]);
		expect(lines.length).toBeGreaterThan(0);
	});

	it('echo returns the input text', async () => {
		const cmd = getCommand('echo')!;
		const lines = await cmd.handler(['hello', 'world']);
		expect(lines).toHaveLength(1);
		expect(lines[0].text).toBe('hello world');
		expect(lines[0].type).toBe('stdout');
	});

	it('whoami returns visitor', async () => {
		const cmd = getCommand('whoami')!;
		const lines = await cmd.handler([]);
		expect(lines).toHaveLength(1);
		expect(lines[0].text).toBe('visitor');
	});

	it('clear returns empty array', async () => {
		const cmd = getCommand('clear')!;
		const lines = await cmd.handler([]);
		expect(lines).toEqual([]);
	});

	it('project without args returns error', async () => {
		const cmd = getCommand('project')!;
		const lines = await cmd.handler([]);
		expect(lines.some((l) => l.type === 'error')).toBe(true);
	});

	it('theme without args shows current mode and accent', async () => {
		const cmd = getCommand('theme')!;
		const lines = await cmd.handler([]);
		expect(lines.some((l) => l.text.includes('Mode:'))).toBe(true);
		expect(lines.some((l) => l.text.includes('Accent:'))).toBe(true);
	});

	it('theme with invalid name returns error', async () => {
		const cmd = getCommand('theme')!;
		const lines = await cmd.handler(['neon']);
		expect(lines.some((l) => l.type === 'error')).toBe(true);
	});

	it('theme with valid mode sets mode', async () => {
		const cmd = getCommand('theme')!;
		const lines = await cmd.handler(['light']);
		expect(lines.some((l) => l.text.includes('Mode set to: light'))).toBe(true);
	});
});
