import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";

export async function run() {
  try {
    // Get inputs
    const upstreamUrl = core.getInput("upstream-url", { required: true });
    const upstreamBranch = core.getInput("upstream-branch") || "main";
    const targetBranch = core.getInput("target-branch") || "main";
    const userEmail = core.getInput("user-email") || "action@github.com";
    const userName = core.getInput("user-name") || "GitHub Action";
    const prTitle = core.getInput("pr-title") || "Merge upstream changes";
    const prBody = core.getInput("pr-body") || "This PR merges changes from upstream.";
    const prBranchPrefix = core.getInput("pr-branch-prefix") || "sync-upstream";
    const githubToken = core.getInput("github-token", { required: true });

    core.startGroup("Setting up git config");
    await exec.exec("git", ["config", "--local", "user.name", userName]);
    await exec.exec("git", ["config", "--local", "user.email", userEmail]);
    core.endGroup();

    core.startGroup("Adding upstream remote and fetching");
    // Check if upstream remote exists
    let upstreamExists = false;
    try {
      await exec.exec("git", ["remote", "get-url", "upstream"], {
        silent: true,
      });
      upstreamExists = true;
    } catch {
      // upstream doesn't exist, will add it
    }

    if (!upstreamExists) {
      await exec.exec("git", ["remote", "add", "upstream", upstreamUrl]);
    } else {
      // Update upstream URL if it exists
      await exec.exec("git", ["remote", "set-url", "upstream", upstreamUrl]);
    }
    await exec.exec("git", ["fetch", "upstream", upstreamBranch]);
    core.endGroup();

    core.startGroup("Checking out target branch");
    await exec.exec("git", ["checkout", targetBranch]);
    core.endGroup();

    core.startGroup("Checking for new commits");
    let commitCount = "";
    await exec.exec("git", ["rev-list", "--count", `HEAD..upstream/${upstreamBranch}`], {
      listeners: {
        stdout: (data) => {
          commitCount += data.toString();
        },
      },
    });

    const hasChanges = parseInt(commitCount.trim()) > 0;
    core.info(`Has changes: ${hasChanges} (${commitCount.trim()} commits)`);
    core.endGroup();

    if (!hasChanges) {
      core.info("No new commits from upstream. Exiting.");
      return;
    }

    // Create PR branch and merge
    core.startGroup("Creating PR branch and merging");
    const octokit = github.getOctokit(githubToken);
    const prBranch = `${prBranchPrefix}-${github.context.runId}`;

    // Create and checkout PR branch
    await exec.exec("git", ["checkout", "-b", prBranch]);

    // Attempt merge
    try {
      await exec.exec("git", ["merge", "--allow-unrelated-histories", `upstream/${upstreamBranch}`]);
      core.info("Merge successful!");
    } catch (error) {
      core.setFailed(`Merge failed with conflicts: ${error.message}`);
      throw error;
    }

    // Push to PR branch
    await exec.exec("git", ["push", "-u", "origin", prBranch]);
    core.endGroup();

    // Create PR
    core.startGroup("Creating pull request");
    const { data: pr } = await octokit.rest.pulls.create({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      title: prTitle,
      body: prBody,
      head: prBranch,
      base: targetBranch,
    });

    core.info(`Pull request created: ${pr.html_url}`);
    core.endGroup();

    // Close old PRs with same title and branch prefix
    core.startGroup("Checking for old PRs to close");
    const { data: allPrs } = await octokit.rest.pulls.list({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      state: "open",
    });

    for (const oldPr of allPrs) {
      if (oldPr.head.ref.startsWith(prBranchPrefix) && oldPr.title === prTitle && oldPr.number !== pr.number) {
        core.info(`Closing old PR #${oldPr.number}: ${oldPr.title}`);

        // Add comment
        await octokit.rest.issues.createComment({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          issue_number: oldPr.number,
          body: `Closing this PR as a new sync PR has been created: #${pr.number}`,
        });

        // Close PR
        await octokit.rest.pulls.update({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          pull_number: oldPr.number,
          state: "closed",
        });

        core.info(`Closed PR #${oldPr.number}`);
      }
    }
    core.endGroup();

    core.info("Sync complete");
  } catch (error) {
    core.setFailed(error.message);
  }
}

// Only run if not in test environment
if (process.env.NODE_ENV !== "test") {
  run();
}
