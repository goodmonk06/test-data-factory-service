.PHONY: help install setup start dev stop build clean seed cli

help:
	@echo "Test Data Factory Service - Available commands:"
	@echo ""
	@echo "  make install    - Install dependencies"
	@echo "  make setup      - Setup database and generate Prisma client"
	@echo "  make start      - Start PostgreSQL with Docker"
	@echo "  make dev        - Start the development server"
	@echo "  make stop       - Stop PostgreSQL container"
	@echo "  make build      - Build the TypeScript project"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make cli        - Run CLI commands (e.g., make cli ARGS='list')"
	@echo ""

install:
	npm install

setup:
	docker-compose up -d
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 3
	npx prisma generate
	npx prisma migrate dev --name init

start:
	docker-compose up -d

dev:
	npm run dev

stop:
	docker-compose down

build:
	npm run build

clean:
	rm -rf dist node_modules

cli:
	npm run cli -- $(ARGS)
