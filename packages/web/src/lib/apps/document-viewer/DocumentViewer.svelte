<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '$lib/os/i18n.svelte.js';
	import { localeStore } from '$lib/os/locale-store.svelte.js';
	import type { CvData, TranslationMeta } from '@curios/shared/types';
	import { fetchCv, getPdfUrl } from './api.js';
	import CvSection from './CvSection.svelte';
	import TranslationBadge from '$lib/components/os/TranslationBadge.svelte';
	import { formatCvDate } from '$lib/utils/format-date.js';

	let cv = $state<CvData | null>(null);
	let translationMeta = $state<TranslationMeta | undefined>(undefined);
	let loading = $state(true);
	let error = $state<string | null>(null);

	function isLlmTranslated(entityId: string, field: string): boolean {
		return translationMeta?.[`${entityId}:${field}`]?.translatedBy === 'llm';
	}

	$effect(() => {
		void localeStore.current; // track locale changes for re-fetch
		untrack(() => {
			fetchCv()
				.then((result) => {
					cv = result.data;
					translationMeta = result.translationMeta;
				})
				.catch((err) => {
					error = err.message;
				})
				.finally(() => {
					loading = false;
				});
		});
	});

	function formatDate(date: string | null): string {
		return formatCvDate(date, localeStore.current, t('cv.present'));
	}

	function downloadPdf() {
		window.open(getPdfUrl(localeStore.current), '_blank');
	}
</script>

<div class="document-viewer">
	<div class="toolbar">
		<span class="toolbar-title">{t('cv.toolbar')}</span>
		<button class="download-btn" onclick={downloadPdf}>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
				<polyline points="7 10 12 15 17 10" />
				<line x1="12" y1="15" x2="12" y2="3" />
			</svg>
			{t('cv.downloadPdf')}
		</button>
	</div>

	<div class="document">
		{#if loading}
			<p class="status">{t('cv.loading')}</p>
		{:else if error}
			<p class="status error">{error}</p>
		{:else if cv}
			<!-- Header -->
			<header class="cv-header">
				<h1 class="cv-name">{cv.profile.name}</h1>
				<p class="cv-title">{cv.profile.title}</p>
				<p class="cv-contact">
					{cv.profile.location} · {cv.profile.email}
					{#if cv.profile.github}
						· <a href={cv.profile.github} target="_blank" rel="noopener external"
							>{cv.profile.github.replace('https://github.com/', 'github/')}</a
						>
					{/if}
				</p>
			</header>

			<!-- About -->
			<CvSection title={t('cv.about')}>
				<p class="cv-bio">
					{cv.profile.bio}
					<TranslationBadge
						show={localeStore.current !== 'en' && isLlmTranslated(cv.profile.id, 'bio')}
					/>
				</p>
			</CvSection>

			<!-- Experience -->
			{#if cv.experience.length > 0}
				<CvSection title={t('cv.experience')}>
					{#each cv.experience as exp (exp.id)}
						<div class="cv-entry">
							<div class="entry-header">
								<span class="entry-role">
									{exp.role}
									<TranslationBadge
										show={localeStore.current !== 'en' && isLlmTranslated(exp.id, 'role')}
									/>
								</span>
								<span class="entry-dates"
									>{formatDate(exp.startDate)} — {formatDate(exp.endDate)}</span
								>
							</div>
							<span class="entry-org">{exp.company}</span>
							<p class="entry-desc">
								{exp.description}
								<TranslationBadge
									show={localeStore.current !== 'en' && isLlmTranslated(exp.id, 'description')}
								/>
							</p>
							<div class="entry-tags">
								{#each exp.tech as tech (tech)}
									<span class="tag">{tech}</span>
								{/each}
							</div>
						</div>
					{/each}
				</CvSection>
			{/if}

			<!-- Education -->
			{#if cv.education.length > 0}
				<CvSection title={t('cv.education')}>
					{#each cv.education as edu (edu.id)}
						<div class="cv-entry">
							<div class="entry-header">
								<span class="entry-role">
									{edu.degree} in {edu.field}
									<TranslationBadge
										show={localeStore.current !== 'en' &&
											(isLlmTranslated(edu.id, 'degree') || isLlmTranslated(edu.id, 'field'))}
									/>
								</span>
								<span class="entry-dates"
									>{formatDate(edu.startDate)} — {formatDate(edu.endDate)}</span
								>
							</div>
							<span class="entry-org">{edu.institution}</span>
							{#if edu.description}
								<p class="entry-desc">
									{edu.description}
									<TranslationBadge
										show={localeStore.current !== 'en' && isLlmTranslated(edu.id, 'description')}
									/>
								</p>
							{/if}
						</div>
					{/each}
				</CvSection>
			{/if}

			<!-- Skills -->
			{#if cv.skills.length > 0}
				<CvSection title={t('cv.skills')}>
					{@const groups = cv.skills.reduce(
						(acc, s) => {
							if (!acc[s.category]) acc[s.category] = [];
							acc[s.category].push(s.name);
							return acc;
						},
						{} as Record<string, string[]>
					)}
					{#each Object.entries(groups) as [category, names] (category)}
						<div class="skill-row">
							<span class="skill-category">{category}</span>
							<span class="skill-list">{names.join(', ')}</span>
						</div>
					{/each}
				</CvSection>
			{/if}

			<!-- Projects -->
			{#if cv.projects.length > 0}
				<CvSection title={t('cv.projects')}>
					{#each cv.projects as project (project.slug)}
						<div class="cv-entry">
							<div class="entry-header">
								<span class="entry-role">
									{project.title}
									<TranslationBadge
										show={localeStore.current !== 'en' && isLlmTranslated(project.id, 'title')}
									/>
								</span>
							</div>
							<p class="entry-desc">
								{project.description}
								<TranslationBadge
									show={localeStore.current !== 'en' && isLlmTranslated(project.id, 'description')}
								/>
							</p>
							<div class="entry-tags">
								{#each project.tech as tech (tech)}
									<span class="tag">{tech}</span>
								{/each}
							</div>
						</div>
					{/each}
				</CvSection>
			{/if}
		{/if}
	</div>
</div>

<style>
	.document-viewer {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-2) var(--space-4);
		border-bottom: 1px solid var(--color-explorer-border);
		flex-shrink: 0;
	}

	.toolbar-title {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-weight: var(--font-weight-medium);
	}

	.download-btn {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-3);
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-button);
		background: transparent;
		color: var(--color-accent);
		font-family: inherit;
		font-size: var(--text-xs);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.download-btn:hover {
		background: var(--color-accent);
		color: white;
	}

	.download-btn:active {
		transform: scale(0.96);
	}

	.document {
		flex: 1;
		overflow-y: auto;
		padding: var(--space-6) var(--space-6);
		background: var(--color-document-bg);
	}

	.status {
		color: var(--color-text-secondary);
		font-size: var(--text-sm);
	}

	.status.error {
		color: var(--color-control-close);
	}

	/* ── Header ── */
	.cv-header {
		margin-bottom: var(--space-5);
		padding-bottom: var(--space-4);
		border-bottom: 2px solid var(--color-accent);
	}

	.cv-name {
		font-size: 1.5rem;
		font-weight: var(--font-weight-semibold);
		letter-spacing: 0.02em;
		margin-bottom: var(--space-1);
	}

	.cv-title {
		font-size: var(--text-md);
		color: var(--color-accent);
		margin-bottom: var(--space-2);
	}

	.cv-contact {
		font-size: var(--text-xs);
		color: var(--color-text-muted);
	}

	.cv-contact a {
		color: var(--color-text-secondary);
		text-decoration: none;
	}

	.cv-contact a:hover {
		color: var(--color-accent);
	}

	/* ── Content ── */
	.cv-bio {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: 1.7;
	}

	.cv-entry {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.entry-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.entry-role {
		font-size: var(--text-base);
		font-weight: var(--font-weight-semibold);
	}

	.entry-dates {
		font-size: var(--text-xs);
		font-family: var(--font-mono);
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.entry-org {
		font-size: var(--text-sm);
		color: var(--color-accent);
	}

	.entry-desc {
		font-size: var(--text-sm);
		color: var(--color-text-secondary);
		line-height: 1.6;
	}

	.entry-tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		margin-top: var(--space-1);
	}

	.tag {
		padding: 1px var(--space-2);
		border-radius: var(--radius-button);
		background: var(--color-explorer-item-hover);
		color: var(--color-text-secondary);
		font-size: 0.65rem;
		font-family: var(--font-mono);
	}

	/* ── Skills ── */
	.skill-row {
		display: flex;
		gap: var(--space-3);
		font-size: var(--text-sm);
	}

	.skill-category {
		font-weight: var(--font-weight-medium);
		color: var(--color-text-primary);
		min-width: 80px;
		flex-shrink: 0;
	}

	.skill-list {
		color: var(--color-text-secondary);
	}
</style>
