# CuriOS

A portfolio site at [mattiasubbesen.com](https://mattiasubbesen.com) that presents as a browser-based operating system. Every app in the desktop environment is a real, functional piece of software — the terminal runs commands against a live API, the system monitor shows actual request metrics, and the AI chat agent queries a real knowledge profile.

## Apps

- **File Explorer** — browses projects, skills, experience, and education from a PostgreSQL database with folder navigation and breadcrumbs
- **Terminal** — sandboxed CLI with commands like `neofetch`, `projects`, `cv`, and `theme` that hit the real backend API
- **System Monitor** — real-time charts (SVG polyline) showing request rates, status codes, and response times via WebSocket
- **Chat** — AI agent powered by Anthropic Claude that queries [Dossier](https://github.com/legitmattias/dossier) via MCP for accurate, sourced answers about skills and experience
- **Document Viewer** — CV with server-side PDF generation (pdf-lib), available in English and Swedish
- **Settings** — theme system (dark/light mode, 4 accent colors, high contrast toggle), language switching, system info

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | SvelteKit (Svelte 5 runes) | Custom window manager, drag/resize, CSS design tokens |
| Backend | Hono + Bun | OpenAPI/Swagger docs, WebSocket support |
| Database | PostgreSQL 17 | Drizzle ORM with typed schema and migrations |
| Real-time | WebSockets | Hono/Bun native — System Monitor + Chat streaming |
| AI | Anthropic SDK + MCP | Tool use loop with streaming, Dossier integration |
| Deployment | Docker + GitHub Actions | Docker context over SSH, Caddy reverse proxy |
| Monorepo | pnpm workspaces | Shared types package, lint-staged pre-commit hooks |
| i18n | Dual-layer | JSON for UI strings, DB translations table for content (EN/SV) |

## Architecture

```
mattiasubbesen.com          → SvelteKit frontend (Docker, port 3000)
curios.mattic.dev/api       → Hono REST API (Docker, port 4000)
```

The frontend and API run as separate Docker containers on a Hetzner VPS, with a parallel staging environment for pre-production verification. Caddy handles TLS and reverse proxying. GitHub Actions builds images, pushes to GHCR, and deploys via Docker context over SSH — no config files or scripts on the server.

The AI chat agent connects to [Dossier](https://github.com/legitmattias/dossier) via the Model Context Protocol (MCP) to query skills, goals, and profile data at runtime. Local tools query the CuriOS database for projects, experience, and education.

## Project Structure

```
packages/
  api/       Hono backend — routes, WebSocket handlers, services, DB
  web/       SvelteKit frontend — OS components, apps, themes, i18n
  shared/    Zod schemas and TypeScript types shared across packages
```

## Development

```bash
pnpm install
pnpm dev:api    # API on localhost:4000
pnpm dev:web    # Frontend on localhost:5173
```

Requires PostgreSQL, Node 22+, and a `.env` file (see `.env.example` files in each package).

## License

This project is the personal portfolio of [Mattias Ubbesen](https://github.com/legitmattias). The source code is public for transparency and learning purposes.
