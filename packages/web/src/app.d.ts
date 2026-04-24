// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			admin?: { userId: string };
			// Chosen shell for the visitor. Cookie override first, then UA sniff.
			shell?: 'mobile' | 'desktop';
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
