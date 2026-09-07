.DEFAULT_GOAL := help

NODE ?= node
PROJECT_ROOT ?=
REPO_ROOT ?= $(PROJECT_ROOT)
SKILLS_HOME ?= $(if $(CODEX_HOME),$(CODEX_HOME)/skills,$(HOME)/.codex/skills)
REPLACE_SKILL ?= 0
CLI := .agents/skills/project-guideline-workflow/scripts/project-standards.mjs
SKILL_CLI := .agents/skills/project-guideline-workflow/scripts/manage-user-skill.mjs

.PHONY: help install update installed-check skill-sync skill-check skill-resolve sync check test

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

skill-sync: ## Cache this release and link the user skill to its verified snapshot.
	$(NODE) $(SKILL_CLI) sync --skills-home "$(SKILLS_HOME)" \
		$(if $(filter 1,$(REPLACE_SKILL)),--replace-recognized,)

skill-check: ## Verify the user skill, or resolve PROJECT_ROOT's pinned snapshot.
	$(NODE) $(SKILL_CLI) check --skills-home "$(SKILLS_HOME)" $(if $(PROJECT_ROOT),--target "$(PROJECT_ROOT)",)

skill-resolve: ## Print the verified skill root for PROJECT_ROOT's locked version.
	@test -n "$(PROJECT_ROOT)" || (echo "PROJECT_ROOT is required" >&2; exit 2)
	@$(NODE) $(SKILL_CLI) resolve --skills-home "$(SKILLS_HOME)" --target "$(PROJECT_ROOT)"

sync: ## Preflight then sequentially update one project and its user skill.
	@test -n "$(PROJECT_ROOT)" || (echo "PROJECT_ROOT is required" >&2; exit 2)
	$(NODE) .agents/skills/project-guideline-workflow/scripts/sync-standards.mjs \
		--target "$(PROJECT_ROOT)" --repo-root "$(REPO_ROOT)" --skills-home "$(SKILLS_HOME)" \
		$(if $(filter 1,$(REPLACE_SKILL)),--replace-recognized,)

check: ## Validate package structure, guideline baseline, installer behavior, and skill.
	pnpm run check

test: ## Run installer behavior tests.
	pnpm run test
