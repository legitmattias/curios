# CuriOS Development Makefile
# Usage: make <target>

DATABASE_URL ?= postgres://curios:curios@localhost:5432/curios
PUBLIC_API_URL ?= http://localhost:4000
PORT ?= 4000

export DATABASE_URL
export PUBLIC_API_URL
export PORT

# ── Quick start ──────────────────────────────────────────────

.PHONY: setup
setup: db-start db-migrate db-seed ## First-time setup: start postgres, migrate, seed

.PHONY: dev
dev: ## Start both API and web dev servers (requires postgres running)
	@echo "Starting API on :4000 and Web on :5173..."
	@echo "Stop with Ctrl+C"
	@$(MAKE) -j2 dev-api dev-web

.PHONY: dev-api
dev-api: ## Start API dev server
	cd packages/api && bun run --hot src/index.ts

.PHONY: dev-web
dev-web: ## Start web dev server
	pnpm --filter @curios/web dev

# ── Database ─────────────────────────────────────────────────

.PHONY: db-start
db-start: ## Start postgres container
	docker compose up -d postgres
	@echo "Waiting for postgres..."
	@until docker compose exec postgres pg_isready -U curios -q 2>/dev/null; do sleep 0.5; done
	@echo "Postgres ready."

.PHONY: db-stop
db-stop: ## Stop postgres container
	docker compose stop postgres

.PHONY: db-migrate
db-migrate: ## Run database migrations
	pnpm --filter @curios/api db:migrate

.PHONY: db-seed
db-seed: ## Seed the database
	pnpm --filter @curios/api db:seed

.PHONY: db-generate
db-generate: ## Generate new migration from schema changes
	pnpm --filter @curios/api db:generate

.PHONY: db-studio
db-studio: ## Open Drizzle Studio (database GUI)
	pnpm --filter @curios/api db:studio

.PHONY: db-reset
db-reset: ## Drop and recreate database, then migrate and seed
	docker compose down -v
	$(MAKE) db-start
	$(MAKE) db-migrate
	$(MAKE) db-seed

# ── Quality ──────────────────────────────────────────────────

.PHONY: test
test: ## Run all tests
	pnpm -r test

.PHONY: test-api
test-api: ## Run API tests only
	pnpm --filter @curios/api test

.PHONY: test-web
test-web: ## Run web tests only
	pnpm --filter @curios/web test

.PHONY: test-shared
test-shared: ## Run shared package tests only
	pnpm --filter @curios/shared test

.PHONY: lint
lint: ## Run linter across all packages
	pnpm -r lint

.PHONY: format
format: ## Auto-format all packages
	pnpm --filter @curios/web format

.PHONY: check
check: ## Run Svelte type checker
	pnpm --filter @curios/web check

.PHONY: verify
verify: lint check test build ## Run lint, type check, tests, and build

# ── Build ────────────────────────────────────────────────────

.PHONY: build
build: ## Build all packages
	pnpm -r build

.PHONY: preview
preview: ## Preview production web build
	pnpm --filter @curios/web preview

# ── Docker ───────────────────────────────────────────────────

.PHONY: up
up: ## Start all services (postgres + api + web)
	docker compose up -d

.PHONY: down
down: ## Stop all services
	docker compose down

.PHONY: logs
logs: ## Tail logs from all services
	docker compose logs -f

# ── Cleanup ──────────────────────────────────────────────────

.PHONY: clean
clean: ## Remove build artifacts
	rm -rf packages/web/build packages/web/.svelte-kit

.PHONY: nuke
nuke: down clean ## Stop everything and remove build artifacts + database volume
	docker compose down -v

# ── Help ─────────────────────────────────────────────────────

.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
