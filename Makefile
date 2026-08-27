.DEFAULT_GOAL := help

NODE ?= node
PROJECT_ROOT ?=
REPO_ROOT ?= $(PROJECT_ROOT)
CLI := .agents/skills/project-guideline-workflow/scripts/project-standards.mjs

.PHONY: help install update installed-check check test

help: ## List available commands.
	@awk 'BEGIN {FS = ":.*## "; printf "Doxanh Project Standards\n\n"} /^[a-zA-Z0-9_-]+:.*## / {printf "  %-18s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install/adopt standards. Requires PROJECT_ROOT; REPO_ROOT defaults to it.
	@test -n "$(PROJECT_ROOT)" || (echo "PROJECT_ROOT is required" >&2; exit 2)
	$(NODE) $(CLI) install --target "$(PROJECT_ROOT)" --repo-root "$(REPO_ROOT)"

update: ## Safely update an installed project. Requires PROJECT_ROOT.
	@test -n "$(PROJECT_ROOT)" || (echo "PROJECT_ROOT is required" >&2; exit 2)
	$(NODE) $(CLI) update --target "$(PROJECT_ROOT)" --repo-root "$(REPO_ROOT)"

installed-check: ## Verify an installed version and every managed file digest.
	@test -n "$(PROJECT_ROOT)" || (echo "PROJECT_ROOT is required" >&2; exit 2)
	$(NODE) $(CLI) check --target "$(PROJECT_ROOT)" --repo-root "$(REPO_ROOT)"

check: ## Validate package structure, guideline baseline, installer behavior, and skill.
	pnpm run check

test: ## Run installer behavior tests.
	pnpm run test
