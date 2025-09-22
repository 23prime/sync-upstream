# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Action that syncs upstream repository changes. It automatically merges changes if there are no conflicts, or creates a pull request if conflicts need to be resolved manually.

The action is implemented as a composite action in `action.yml` that uses shell scripts to:

1. Configure git and add upstream remote
2. Check for new commits from upstream
3. Attempt automatic merge or create PR for conflicts

For repositories with branch protection rules, use the `always-use-pr: true` parameter to bypass direct push restrictions by always creating pull requests.

## Key Parameters

The action supports several parameters for customizing behavior:

- **Branch Configuration**: `upstream-branch` (default: `main`), `target-branch` (default: `main`)
- **PR Control**: `always-use-pr` (default: `false`) - Forces PR creation even without conflicts
- **PR Customization**: `pr-title`, `pr-body`, `pr-branch-prefix` - Customize PR appearance
- **Git Identity**: `user-name`, `user-email` - Configure commit author

## Development Commands

This project uses [Taskfile](https://taskfile.dev/) for task management and [mise](https://mise.jdx.dev/) for tool management.

### Setup

```bash
task setup  # or task s
```

### Linting and Checking

```bash
task check  # or task c - runs all checks
```

Individual checks:

- `task yml:check` - YAML linting with yamllint
- `task json:check` - JSON formatting and linting with biome
- `task md:check` - Markdown linting with markdownlint
- `task gh:check` - GitHub Actions workflow validation with actionlint

### Auto-fixing

- `task md:fix` - Auto-fix markdown issues
- `task json:fix` - Format JSON files

### Release

```bash
task tag:1  # Create and push release tag v1
```

## Architecture

- `action.yml` - Main composite action definition with all steps
- `tasks/` - Taskfile includes for different file types (YAML, JSON, Markdown, GitHub Actions)
- Configuration files:
  - `.markdownlint.yml` - Markdown linting rules
  - `.yamllint.yml` - YAML linting rules
  - `biome.jsonc` - JSON/JS formatting and linting
  - `mise.toml` - Tool versions and dependencies

## Tool Dependencies

Tools are managed via mise and defined in `mise.toml`:

- yamllint - YAML linting
- markdownlint-cli - Markdown linting
- biome - JSON/JS formatting and linting
- actionlint - GitHub Actions workflow validation
- shellcheck - Shell script linting (used by actionlint)
