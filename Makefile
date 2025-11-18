.PHONY: help install setup start dev stop build clean test lint seed cli docker-up docker-down

help:
	@echo "Test Data Factory Service - Available commands:"
	@echo ""
	@echo "  Development:"
	@echo "    make install      - Install dependencies"
	@echo "    make dev          - Start development server"
	@echo "    make build        - Build TypeScript project"
	@echo "    make clean        - Clean build artifacts"
	@echo ""
	@echo "  Docker:"
	@echo "    make docker-up    - Start all services (PostgreSQL + App)"
	@echo "    make docker-down  - Stop all services"
	@echo "    make start        - Start PostgreSQL only"
	@echo "    make stop         - Stop PostgreSQL only"
	@echo ""
	@echo "  Database:"
	@echo "    make setup        - Setup database and run migrations"
	@echo "    make seed         - Seed example scenarios"
	@echo ""
	@echo "  Testing:"
	@echo "    make test         - Run all tests"
	@echo "    make lint         - Lint code"
	@echo ""
	@echo "  CLI:"
	@echo "    make cli ARGS='list'  - Run CLI commands"
	@echo ""

install:
	npm install

setup:
	@command -v docker >/dev/null 2>&1 && docker compose up -d postgres || echo "Docker not available, skipping..."
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 3
	npx prisma generate
	npm run db:migrate

start:
	@command -v docker >/dev/null 2>&1 && docker compose up -d postgres || echo "Docker not available"

docker-up:
	@command -v docker >/dev/null 2>&1 && docker compose up -d || echo "Docker not available"

docker-down:
	@command -v docker >/dev/null 2>&1 && docker compose down || echo "Docker not available"

dev:
	npm run dev

stop:
	@command -v docker >/dev/null 2>&1 && docker compose down || echo "Docker not available"

build:
	npm run build

test:
	npm test

lint:
	npm run lint

seed:
	npm run db:seed

clean:
	rm -rf dist coverage node_modules/.cache

cli:
	npm run cli -- $(ARGS)
