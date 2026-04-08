import { stdout, error, system, type OutputLine } from './output.js';
import {
	fetchProjects,
	fetchProject,
	fetchSkills,
	fetchExperience,
	fetchProfile,
	fetchHealth,
	fetchCv
} from './api.js';
import { themeStore, type Theme } from '$lib/os/theme-store.svelte.js';
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
			for (const p of projects) {
				lines.push(stdout(`  ${p.slug.padEnd(14)} ${p.title}`));
				lines.push(stdout(`  ${''.padEnd(14)} ${p.tech.join(', ')}`));
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
				stdout(`Tech:  ${p.tech.join(', ')}`)
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
				`Host:    mattic.dev`,
				`Owner:   ${profile.name}`,
				`Uptime:  ${formatUptime(health.uptime)}`,
				`Shell:   curios-terminal`,
				`Theme:   ${themeStore.current}`,
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
				system(`${t('terminal.cv.downloadPdf')} ${cv.profile.website ?? 'mattic.dev'}/cv/pdf`)
			);
			return lines;
		}
	},
	{
		name: 'theme',
		description: 'Switch theme',
		usage: 'theme [dark|light|high-contrast]',
		handler: async (args) => {
			const valid: Theme[] = ['dark', 'light', 'high-contrast'];
			if (args.length === 0) {
				return [
					stdout(`${t('terminal.theme.current')} ${themeStore.current}`),
					system(`${t('terminal.theme.available')} ${valid.join(', ')}`)
				];
			}
			const requested = args[0] as Theme;
			if (!valid.includes(requested)) {
				return [
					error(`${t('terminal.theme.unknown')} ${requested}`),
					system(`${t('terminal.theme.available')} ${valid.join(', ')}`)
				];
			}
			themeStore.set(requested);
			return [stdout(`${t('terminal.theme.setTo')} ${requested}`)];
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
