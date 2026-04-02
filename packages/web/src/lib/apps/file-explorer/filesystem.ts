export type ViewType =
	| 'root'
	| 'project-list'
	| 'project-detail'
	| 'skills'
	| 'experience'
	| 'about'
	| 'contact';

export interface VirtualNode {
	name: string;
	path: string;
	icon: string;
	view: ViewType;
	children?: VirtualNode[];
	/** For parameterized views like project-detail */
	param?: string;
}

export const FILESYSTEM: VirtualNode = {
	name: 'root',
	path: '/',
	icon: '💻',
	view: 'root',
	children: [
		{
			name: 'projects',
			path: '/projects',
			icon: '📁',
			view: 'project-list',
			children: [] // populated dynamically from API
		},
		{
			name: 'about',
			path: '/about',
			icon: '📄',
			view: 'about'
		},
		{
			name: 'experience',
			path: '/experience',
			icon: '💼',
			view: 'experience'
		},
		{
			name: 'skills',
			path: '/skills',
			icon: '🛠',
			view: 'skills'
		},
		{
			name: 'contact',
			path: '/contact',
			icon: '✉',
			view: 'contact'
		}
	]
};

/** Find a node by path in the tree */
export function findNode(root: VirtualNode, path: string): VirtualNode | null {
	if (root.path === path) return root;
	if (root.children) {
		for (const child of root.children) {
			const found = findNode(child, path);
			if (found) return found;
		}
	}
	return null;
}

/** Get breadcrumb segments from a path */
export function getBreadcrumbs(path: string): { name: string; path: string }[] {
	if (path === '/') return [{ name: 'root', path: '/' }];

	const segments = path.split('/').filter(Boolean);
	const crumbs = [{ name: 'root', path: '/' }];

	let current = '';
	for (const seg of segments) {
		current += '/' + seg;
		crumbs.push({ name: seg, path: current });
	}

	return crumbs;
}
