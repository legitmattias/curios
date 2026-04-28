import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Source-map upload runs only when an auth token is provided (i.e. in CI).
// Local builds skip the upload but still emit maps locally.
const sentryEnabled = !!process.env.SENTRY_AUTH_TOKEN;

export default defineConfig({
	plugins: [
		sveltekit(),
		sentryEnabled &&
			sentryVitePlugin({
				org: process.env.SENTRY_ORG,
				project: process.env.SENTRY_PROJECT,
				authToken: process.env.SENTRY_AUTH_TOKEN,
				release: { name: process.env.PUBLIC_SENTRY_RELEASE },
				sourcemaps: {
					// Strip maps from the deployed bundle after upload so they
					// don't leak source structure to visitors.
					filesToDeleteAfterUpload: ['**/*.js.map', '**/*.mjs.map']
				}
			})
	],
	build: {
		// Source maps are needed for Sentry to translate minified stack traces.
		sourcemap: true
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**']
				}
			},

			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
