# ChainEstate — Development Makefile
# Usage: make <target>

.PHONY: help install dev compile test deploy-local seed-local deploy-testnet seed-testnet verify-testnet clean

HH = TS_NODE_PROJECT=tsconfig.hardhat.json npx hardhat

## ─── Help ───────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "  ChainEstate — Available Commands"
	@echo "  ─────────────────────────────────────────────────────────"
	@echo "  make install          Install all dependencies"
	@echo "  make dev              Run Next.js frontend (localhost:3000)"
	@echo ""
	@echo "  make compile          Compile Solidity contracts"
	@echo "  make test             Run all 60 tests"
	@echo ""
	@echo "  make deploy-local     Deploy contracts to local Hardhat node"
	@echo "  make seed-local       Seed demo data on local node"
	@echo "  make node             Start local Hardhat node"
	@echo ""
	@echo "  make deploy-testnet   Deploy to Arbitrum Sepolia"
	@echo "  make seed-testnet     Seed demo data on Arbitrum Sepolia"
	@echo "  make verify-testnet   Verify contracts on Arbiscan"
	@echo ""
	@echo "  make clean            Remove build artifacts"
	@echo "  ─────────────────────────────────────────────────────────"
	@echo ""

## ─── Setup ───────────────────────────────────────────────────────────────────

install:
	npm install

## ─── Frontend ────────────────────────────────────────────────────────────────

dev:
	npm run dev

## ─── Contracts ───────────────────────────────────────────────────────────────

compile:
	$(HH) compile

test:
	$(HH) test

typecheck:
	npx tsc --project tsconfig.hardhat.json --noEmit

## ─── Local node ──────────────────────────────────────────────────────────────

node:
	$(HH) node

deploy-local:
	$(HH) run scripts/deploy.ts --network hardhat

seed-local:
	$(HH) run scripts/seed.ts --network hardhat

## ─── Arbitrum Sepolia ────────────────────────────────────────────────────────

deploy-testnet:
	$(HH) run scripts/deploy.ts --network arbitrumSepolia

seed-testnet:
	$(HH) run scripts/seed.ts --network arbitrumSepolia

verify-testnet:
	$(HH) run scripts/verify.ts --network arbitrumSepolia

## ─── Maintenance ─────────────────────────────────────────────────────────────

clean:
	rm -rf artifacts cache typechain-types deployments.json

rebuild: clean compile
