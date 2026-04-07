import { describe, it, expect } from 'vitest';
import { findNode, getBreadcrumbs, FILESYSTEM, type VirtualNode } from './filesystem.js';

describe('findNode', () => {
	it('finds the root node', () => {
		const node = findNode(FILESYSTEM, '/');
		expect(node).not.toBeNull();
		expect(node?.name).toBe('root');
	});

	it('finds a direct child', () => {
		const node = findNode(FILESYSTEM, '/projects');
		expect(node).not.toBeNull();
		expect(node?.name).toBe('projects');
		expect(node?.view).toBe('project-list');
	});

	it('finds all top-level folders', () => {
		const paths = ['/projects', '/about', '/experience', '/skills', '/contact'];
		for (const path of paths) {
			const node = findNode(FILESYSTEM, path);
			expect(node, `expected node at ${path}`).not.toBeNull();
		}
	});

	it('returns null for non-existent path', () => {
		const node = findNode(FILESYSTEM, '/nonexistent');
		expect(node).toBeNull();
	});

	it('finds nested children', () => {
		// Add a child to projects for testing
		const tree: VirtualNode = {
			name: 'root',
			path: '/',
			icon: '💻',
			view: 'root',
			children: [
				{
					name: 'parent',
					path: '/parent',
					icon: '📁',
					view: 'project-list',
					children: [
						{
							name: 'child',
							path: '/parent/child',
							icon: '📄',
							view: 'project-detail',
							param: 'child'
						}
					]
				}
			]
		};

		const node = findNode(tree, '/parent/child');
		expect(node).not.toBeNull();
		expect(node?.name).toBe('child');
	});
});

describe('getBreadcrumbs', () => {
	it('returns root for /', () => {
		const crumbs = getBreadcrumbs('/');
		expect(crumbs).toEqual([{ name: 'root', path: '/' }]);
	});

	it('returns segments for a nested path', () => {
		const crumbs = getBreadcrumbs('/projects/curios');
		expect(crumbs).toEqual([
			{ name: 'root', path: '/' },
			{ name: 'projects', path: '/projects' },
			{ name: 'curios', path: '/projects/curios' }
		]);
	});

	it('returns two segments for a top-level path', () => {
		const crumbs = getBreadcrumbs('/about');
		expect(crumbs).toEqual([
			{ name: 'root', path: '/' },
			{ name: 'about', path: '/about' }
		]);
	});
});
