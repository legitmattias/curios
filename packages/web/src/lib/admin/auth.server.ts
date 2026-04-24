import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';

const COOKIE_NAME = 'curios_admin_session';
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24; // 24h

export interface AdminSession {
	userId: string;
	expiresAt: number;
}

function getSigningSecret(): string | null {
	return process.env.ADMIN_SESSION_SECRET ?? null;
}

export function isAdminConfigured(): boolean {
	return (
		!!process.env.ADMIN_SESSION_SECRET &&
		(process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 16 &&
		!!process.env.ADMIN_PASSWORD
	);
}

function b64urlEncode(buf: Buffer): string {
	return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Buffer {
	const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
	return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(payload: string): string | null {
	const secret = getSigningSecret();
	if (!secret) return null;
	return createHmac('sha256', secret).update(payload).digest('hex');
}

function createSessionToken(session: AdminSession): string | null {
	const payload = b64urlEncode(Buffer.from(JSON.stringify(session)));
	const sig = sign(payload);
	if (!sig) return null;
	return `${payload}.${sig}`;
}

function verifySessionToken(token: string): AdminSession | null {
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [payload, sig] = parts;
	const expected = sign(payload);
	if (!expected) return null;
	if (sig.length !== expected.length) return null;
	try {
		const match = timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
		if (!match) return null;
	} catch {
		return null;
	}
	try {
		const session = JSON.parse(b64urlDecode(payload).toString()) as AdminSession;
		if (!session?.expiresAt || session.expiresAt < Date.now()) return null;
		return session;
	} catch {
		return null;
	}
}

export function setAdminSession(cookies: Cookies, userId: string): AdminSession | null {
	const session: AdminSession = {
		userId,
		expiresAt: Date.now() + COOKIE_MAX_AGE_SEC * 1000
	};
	const token = createSessionToken(session);
	if (!token) return null;
	cookies.set(COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: COOKIE_MAX_AGE_SEC
	});
	return session;
}

export function clearAdminSession(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, { path: '/' });
}

export function getAdminSession(cookies: Cookies): AdminSession | null {
	const raw = cookies.get(COOKIE_NAME);
	if (!raw) return null;
	return verifySessionToken(raw);
}

export function validateAdminPassword(password: string): boolean {
	const expected = process.env.ADMIN_PASSWORD;
	if (!expected) return false;
	// Constant-time compare — pad to equal length before timingSafeEqual.
	const a = Buffer.from(password);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;
	try {
		return timingSafeEqual(a, b);
	} catch {
		return false;
	}
}

// ── Rate limit (in-memory, per server instance) ─────────────────
// Single-admin scope means a tiny map is plenty. Entries clear on server restart.

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, RateLimitEntry>();

export function registerLoginAttempt(ip: string): {
	allowed: boolean;
	remaining: number;
	retryAfterMs: number;
} {
	const now = Date.now();
	const entry = loginAttempts.get(ip);
	if (!entry || entry.resetAt < now) {
		loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
		return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 };
	}
	if (entry.count >= MAX_ATTEMPTS) {
		return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
	}
	entry.count += 1;
	return {
		allowed: true,
		remaining: MAX_ATTEMPTS - entry.count,
		retryAfterMs: 0
	};
}

export function clearLoginAttempts(ip: string): void {
	loginAttempts.delete(ip);
}
