# Sync Upstream Action

A GitHub Action that syncs upstream repository changes. It automatically merges changes if there are no conflicts, or creates a pull request if conflicts need to be resolved manually.

## Usage

### Example

Add the following to your workflow:

```yaml
permissions:
  contents: write
  pull-requests: write

jobs:
  sync-upstream:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0 # Required for commit comparison

      - name: Sync upstream
        uses: 23prime/sync-upstream@v1
        with:
          upstream-url: https://github.com/upstream-owner/upstream-repo.git
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Parameters

| Name                | Required | Default Value                                    | Description                                            |
|---------------------|----------|--------------------------------------------------|--------------------------------------------------------|
| `upstream-url`      | Required | None                                             | GitHub repository URL of the upstream (e.g., <https://github.com/owner/repo.git>) |
| `upstream-branch`   | Optional | `main`                                           | Branch name of the upstream (e.g., main)              |
| `target-branch`     | Optional | `main`                                           | Branch name of the target repository to sync (e.g., main) |
| `user-email`        | Optional | `action@github.com`                              | Git user.email                                         |
| `user-name`         | Optional | `GitHub Action`                                  | Git user.name                                          |
| `pr-title`          | Optional | `Merge upstream changes`                         | Pull Request title when creating a PR                 |
| `pr-body`           | Optional | `This PR merges changes from upstream.`          | Pull Request body when creating a PR                  |
| `pr-branch-prefix`  | Optional | `sync-upstream`                                  | Branch name prefix when creating a PR                 |
| `always-use-pr`     | Optional | `false`                                          | Always create a pull request instead of direct push (useful for branch protection) |
| `github-token`      | Required | None                                             | GitHub token                                           |

## For Developers

### Requirements

- [Taskfile](https://taskfile.dev/)
- [mise](https://mise.jdx.dev/)

### Quick Start

1. Set up tools

   ```bash
   task setup
   ```

2. Install dependencies

   ```bash
   task js:install
   ```

3. Check

   ```bash
   task check
   ```

4. Build

   ```bash
   task js:build
   ```

### Release

Create and push a release tag.

Example: To release `v1`

```bash
task tag:1
```

## References

- [Creating a JavaScript action - GitHub Docs](https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action)
- [Workflow commands for GitHub Actions - GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands)
