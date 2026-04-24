<script lang="ts">
	import { profileStore } from '$lib/os/profile-store.svelte.js';
	import { t } from '$lib/os/i18n.svelte.js';

	const profile = $derived(profileStore.data);
</script>

{#if !profile}
	<p class="state">{t('mobile.loading')}</p>
{:else}
	<section class="about">
		<p class="bio">{profile.bio}</p>

		<dl class="meta">
			<div class="row">
				<dt>{t('mobile.about.location')}</dt>
				<dd>{profile.location}</dd>
			</div>
		</dl>

		<ul class="links" aria-label={t('mobile.about.contact')}>
			<li>
				<a href="mailto:{profile.email}">
					<span class="label">{t('mobile.about.email')}</span>
					<span class="value">{profile.email}</span>
				</a>
			</li>
			<li>
				<a href={profile.github} target="_blank" rel="noopener external">
					<span class="label">GitHub</span>
					<span class="value">{profile.github.replace(/^https?:\/\//, '')}</span>
				</a>
			</li>
			{#if profile.linkedin}
				<li>
					<a href={profile.linkedin} target="_blank" rel="noopener external">
						<span class="label">LinkedIn</span>
						<span class="value">{profile.linkedin.replace(/^https?:\/\//, '')}</span>
					</a>
				</li>
			{/if}
			{#if profile.website}
				<li>
					<a href={profile.website} target="_blank" rel="noopener external">
						<span class="label">{t('mobile.about.website')}</span>
						<span class="value">{profile.website.replace(/^https?:\/\//, '')}</span>
					</a>
				</li>
			{/if}
		</ul>
	</section>
{/if}

<style>
	.state {
		color: var(--color-text-muted);
		font-size: 13px;
	}

	.about {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.bio {
		margin: 0;
		font-size: 15px;
		line-height: 1.6;
		color: var(--color-text-primary);
	}

	.meta {
		display: grid;
		gap: 12px;
		margin: 0;
		padding-top: 12px;
		border-top: 1px solid var(--color-explorer-border);
	}

	.row {
		display: grid;
		grid-template-columns: 96px 1fr;
		gap: 12px;
		align-items: baseline;
		margin: 0;
	}

	.row dt {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.row dd {
		margin: 0;
		font-size: 14px;
		color: var(--color-text-primary);
	}

	.links {
		list-style: none;
		padding: 12px 0 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
		border-top: 1px solid var(--color-explorer-border);
	}

	.links a {
		display: grid;
		grid-template-columns: 96px 1fr;
		gap: 12px;
		align-items: baseline;
		padding: 10px 0;
		text-decoration: none;
		border-bottom: 1px solid var(--color-explorer-border);
	}

	.links li:last-child a {
		border-bottom: none;
	}

	.label {
		font-family: var(--font-mono);
		font-size: 10.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.value {
		font-size: 14px;
		color: var(--color-accent);
		word-break: break-all;
	}
</style>
