import { stdout, error, system, type OutputLine } from './output.js';
import {
	fetchProjects,
	fetchProject,
	fetchSkills,
	fetchExperience,
	fetchEducation,
	fetchProfile,
	fetchHealth,
	fetchCv
} from './api.js';
import { themeStore, type Mode, type Accent } from '$lib/os/theme-store.svelte.js';
import { t } from '$lib/os/i18n.svelte.js';

export interface Command {
	name: string;
	description: string;
	usage?: string;
	handler: (args: string[]) => Promise<OutputLine[]>;
}

function formatUptime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	if (h > 0) return `${h}h ${m}m`;
	return `${m}m`;
}

const COMMANDS: Command[] = [
	{
		name: 'help',
		description: 'Show available commands',
		handler: async () => {
			const lines: OutputLine[] = [system(t('terminal.availableCommands')), stdout('')];
			for (const cmd of COMMANDS) {
				const usage = cmd.usage ? `  ${cmd.usage}` : '';
				const desc = t(`terminal.desc.${cmd.name}`);
				lines.push(stdout(`  ${cmd.name.padEnd(14)} ${desc}${usage}`));
			}
			lines.push(stdout(''));
			lines.push(system(t('terminal.tabHint')));
			return lines;
		}
	},
	{
		name: 'clear',
		description: 'Clear the terminal',
		handler: async () => [] // handled specially in Terminal.svelte
	},
	{
		name: 'status',
		description: 'Show system status',
		handler: async () => {
			const health = await fetchHealth();
			return [
				stdout(`${t('terminal.label.status')}  ${health.status}`),
				stdout(`${t('terminal.label.uptime')}  ${formatUptime(health.uptime)}`)
			];
		}
	},
	{
		name: 'projects',
		description: 'List all projects',
		handler: async () => {
			const projects = await fetchProjects();
			const lines: OutputLine[] = [];
			const indent = 16;
			for (const p of projects) {
				lines.push(stdout(`  ${p.slug.padEnd(indent)} ${p.title}`));
				// Wrap tech tags to fit ~70 chars per line
				const prefix = `  ${''.padEnd(indent)} `;
				const maxWidth = 70 - prefix.length;
				let techLine = '';
				for (const tech of p.tech) {
					const name = typeof tech === 'string' ? tech : tech.name;
					const addition = techLine ? `, ${name}` : name;
					if (techLine && (techLine + addition).length > maxWidth) {
						lines.push(stdout(`${prefix}${techLine},`));
						techLine = name;
					} else {
						techLine += addition;
					}
				}
				if (techLine) lines.push(stdout(`${prefix}${techLine}`));
				lines.push(stdout(''));
			}
			lines.push(system(`${projects.length} ${t('terminal.projects.count')}`));
			return lines;
		}
	},
	{
		name: 'project',
		description: 'Show project details',
		usage: 'project <slug>',
		handler: async (args) => {
			if (args.length === 0) {
				return [error(t('terminal.project.usage')), system(t('terminal.project.hint'))];
			}
			const p = await fetchProject(args[0]);
			const lines: OutputLine[] = [
				stdout(`${p.title}`),
				stdout(`${'─'.repeat(p.title.length)}`),
				stdout(p.description),
				stdout(''),
				stdout(`Tech:  ${p.tech.map((t) => (typeof t === 'string' ? t : t.name)).join(', ')}`)
			];
			if (p.url) lines.push(stdout(`URL:   ${p.url}`));
			if (p.repo) lines.push(stdout(`Repo:  ${p.repo}`));
			return lines;
		}
	},
	{
		name: 'skills',
		description: 'List skills by category',
		handler: async () => {
			const skills = await fetchSkills();
			const groups: Record<string, string[]> = {};
			for (const s of skills) {
				if (!groups[s.category]) groups[s.category] = [];
				groups[s.category].push(s.name);
			}
			const lines: OutputLine[] = [];
			for (const [category, names] of Object.entries(groups)) {
				lines.push(stdout(`  ${category}`));
				lines.push(stdout(`    ${names.join(', ')}`));
				lines.push(stdout(''));
			}
			return lines;
		}
	},
	{
		name: 'experience',
		description: 'Show work experience',
		handler: async () => {
			const entries = await fetchExperience();
			const lines: OutputLine[] = [];
			for (const e of entries) {
				const end = e.endDate ?? t('cv.present');
				lines.push(stdout(`  ${e.role} @ ${e.company}`));
				lines.push(stdout(`  ${e.startDate} — ${end}`));
				lines.push(stdout(`  ${e.tech.join(', ')}`));
				lines.push(stdout(''));
			}
			return lines;
		}
	},
	{
		name: 'education',
		description: 'Show education background',
		handler: async () => {
			const entries = await fetchEducation();
			const lines: OutputLine[] = [];
			for (const e of entries) {
				const end = e.endDate ?? t('cv.present');
				lines.push(stdout(`  ${e.degree} — ${e.field}`));
				lines.push(stdout(`  ${e.institution}`));
				lines.push(stdout(`  ${e.startDate} — ${end}`));
				if (e.description) lines.push(stdout(`  ${e.description}`));
				lines.push(stdout(''));
			}
			return lines;
		}
	},
	{
		name: 'about',
		description: 'About me',
		handler: async () => {
			const p = await fetchProfile();
			return [stdout(p.name), stdout(p.title), stdout(p.location), stdout(''), stdout(p.bio)];
		}
	},
	{
		name: 'contact',
		description: 'Contact information',
		handler: async () => {
			const p = await fetchProfile();
			const lines: OutputLine[] = [
				stdout(`  Email:    ${p.email}`),
				stdout(`  GitHub:   ${p.github}`)
			];
			if (p.linkedin) lines.push(stdout(`  LinkedIn: ${p.linkedin}`));
			if (p.website) lines.push(stdout(`  Website:  ${p.website}`));
			return lines;
		}
	},
	{
		name: 'neofetch',
		description: 'System info with style',
		handler: async () => {
			const [health, profile] = await Promise.all([fetchHealth(), fetchProfile()]);
			const art = [
				'   ____           _ ___  ____  ',
				'  / ___|   _ _ __(_) _ \\/ ___| ',
				" | |  | | | | '__| | | | \\___ \\",
				' | |__| |_| | |  | | |_| |___) |',
				'  \\____\\__,_|_|  |_|\\___/|____/ '
			];
			const info = [
				'visitor@curios',
				'──────────────────',
				`OS:      CuriOS v0.1.0`,
				`Host:    mattiasubbesen.com`,
				`Owner:   ${profile.name}`,
				`Uptime:  ${formatUptime(health.uptime)}`,
				`Shell:   curios-terminal`,
				`Theme:   ${themeStore.mode} + ${themeStore.accent}${themeStore.highContrast ? ' (high contrast)' : ''}`,
				`Backend: Hono + Bun`,
				`DB:      PostgreSQL 17`
			];
			const lines: OutputLine[] = [];
			const maxLines = Math.max(art.length, info.length);
			for (let i = 0; i < maxLines; i++) {
				const left = (art[i] ?? '').padEnd(35);
				const right = info[i] ?? '';
				lines.push(stdout(`${left}${right}`));
			}
			return lines;
		}
	},
	{
		name: 'echo',
		description: 'Echo text back',
		handler: async (args) => {
			return [stdout(args.join(' '))];
		}
	},
	{
		name: 'cv',
		description: 'Print CV summary',
		handler: async () => {
			const cv = await fetchCv();
			const lines: OutputLine[] = [
				stdout(`${cv.profile.name}`),
				stdout(`${cv.profile.title} · ${cv.profile.location}`),
				stdout('')
			];

			if (cv.experience.length > 0) {
				lines.push(system(t('terminal.cv.experience')));
				for (const exp of cv.experience) {
					const end = exp.endDate ?? t('cv.present');
					lines.push(stdout(`  ${exp.role} @ ${exp.company} (${exp.startDate} — ${end})`));
				}
				lines.push(stdout(''));
			}

			if (cv.education.length > 0) {
				lines.push(system(t('terminal.cv.education')));
				for (const edu of cv.education) {
					const end = edu.endDate ?? t('cv.present');
					lines.push(stdout(`  ${edu.degree} in ${edu.field} — ${edu.institution} (${end})`));
				}
				lines.push(stdout(''));
			}

			if (cv.skills.length > 0) {
				lines.push(system(t('terminal.cv.skills')));
				const groups: Record<string, string[]> = {};
				for (const s of cv.skills) {
					if (!groups[s.category]) groups[s.category] = [];
					groups[s.category].push(s.name);
				}
				for (const [cat, names] of Object.entries(groups)) {
					lines.push(stdout(`  ${cat}: ${names.join(', ')}`));
				}
				lines.push(stdout(''));
			}

			lines.push(
				system(
					`${t('terminal.cv.downloadPdf')} ${cv.profile.website ?? 'mattiasubbesen.com'}/cv/pdf`
				)
			);
			return lines;
		}
	},
	{
		name: 'theme',
		description: 'Switch theme mode, accent, or high contrast',
		usage: 'theme [mode <dark|light>] [accent <teal|purple|amber|slate>] [hc]',
		handler: async (args) => {
			const validModes: Mode[] = ['dark', 'light'];
			const validAccents: Accent[] = ['teal', 'purple', 'amber', 'slate'];

			if (args.length === 0) {
				return [
					stdout(
						`${t('terminal.theme.currentMode')} ${themeStore.mode}${themeStore.highContrast ? ' + high contrast' : ''}`
					),
					stdout(`${t('terminal.theme.currentAccent')} ${themeStore.accent}`),
					system(`${t('terminal.theme.availableModes')} ${validModes.join(', ')}`),
					system(`${t('terminal.theme.availableAccents')} ${validAccents.join(', ')}`),
					system('Toggle high contrast: theme hc')
				];
			}

			if (args[0] === 'hc') {
				themeStore.toggleHighContrast();
				return [stdout(`High contrast ${themeStore.highContrast ? 'enabled' : 'disabled'}`)];
			}

			if (args[0] === 'mode' && args[1]) {
				const requested = args[1] as Mode;
				if (!validModes.includes(requested)) {
					return [
						error(`${t('terminal.theme.unknown')} ${requested}`),
						system(`${t('terminal.theme.availableModes')} ${validModes.join(', ')}`)
					];
				}
				themeStore.setMode(requested);
				return [stdout(`${t('terminal.theme.modeSetTo')} ${requested}`)];
			}

			if (args[0] === 'accent' && args[1]) {
				const requested = args[1] as Accent;
				if (!validAccents.includes(requested)) {
					return [
						error(`${t('terminal.theme.unknown')} ${requested}`),
						system(`${t('terminal.theme.availableAccents')} ${validAccents.join(', ')}`)
					];
				}
				themeStore.setAccent(requested);
				return [stdout(`${t('terminal.theme.accentSetTo')} ${requested}`)];
			}

			// Shorthand: theme dark/light
			if (validModes.includes(args[0] as Mode)) {
				themeStore.setMode(args[0] as Mode);
				return [stdout(`${t('terminal.theme.modeSetTo')} ${args[0]}`)];
			}

			return [
				error(`${t('terminal.theme.unknown')} ${args[0]}`),
				system(`${t('terminal.theme.availableModes')} ${validModes.join(', ')}`),
				system(`${t('terminal.theme.availableAccents')} ${validAccents.join(', ')}`)
			];
		}
	},
	{
		name: 'whoami',
		description: 'Who are you?',
		handler: async () => {
			return [stdout('visitor')];
		}
	}
];

const commandMap = new Map(COMMANDS.map((c) => [c.name, c]));

export function getCommand(name: string): Command | undefined {
	return commandMap.get(name);
}

export function getCommandNames(): string[] {
	return COMMANDS.map((c) => c.name);
}

export function findCompletions(partial: string): string[] {
	if (!partial) return [];
	return COMMANDS.filter((c) => c.name.startsWith(partial)).map((c) => c.name);
}
