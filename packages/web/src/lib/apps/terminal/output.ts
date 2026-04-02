export type OutputLineType = 'command' | 'stdout' | 'error' | 'system';

export interface OutputLine {
	id: string;
	type: OutputLineType;
	text: string;
}

let nextId = 0;

export function createLine(type: OutputLineType, text: string): OutputLine {
	return { id: String(nextId++), type, text };
}

export function stdout(text: string): OutputLine {
	return createLine('stdout', text);
}

export function error(text: string): OutputLine {
	return createLine('error', text);
}

export function system(text: string): OutputLine {
	return createLine('system', text);
}

export function command(text: string): OutputLine {
	return createLine('command', text);
}
