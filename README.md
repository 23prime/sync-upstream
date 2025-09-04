# Sync Upstream Action

A GitHub Action that syncs upstream repository changes. It automatically merges changes if there are no conflicts, or creates a pull request if conflicts need to be resolved manually.

## Usage (Example)

Add the following to your workflow:

```yaml
permissions:
  contents: write
  pull-requests: write

jobs:
  your-job:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v5

      - name: Sync upstream
        uses: 23prime/sync-upstream@v1
        with:
          upstream-url: https://github.com/upstream-owner/upstream-repo.git
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Parameters

| Name                | Required | Default Value                                    | Description                                            |
|---------------------|----------|--------------------------------------------------|--------------------------------------------------------|
| `upstream-url`      | Required | None                                             | GitHub repository URL of the upstream                  |
| `upstream-branch`   | Optional | `main`                                           | Branch name of the upstream                            |
| `target-branch`     | Optional | `main`                                           | Branch name of the target repository to sync          |
| `pr-title`          | Optional | `Merge upstream changes (conflicts need to be resolved)` | Pull Request title when conflicts occur               |
| `pr-body`           | Optional | `This PR merges changes from upstream, but conflicts must be resolved manually.` | Pull Request body when conflicts occur                |
| `pr-branch-prefix`  | Optional | `sync-upstream`                                  | Branch name prefix when creating a PR                 |
| `user-email`        | Optional | `action@github.com`                              | Git user.email                                         |
| `user-name`         | Optional | `GitHub Action`                                  | Git user.name                                          |
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

2. Check

    ```bash
    task check
    ```

### Release

Create and push a release tag.

Example: To release `v1`

```bash
task tag:1
```
