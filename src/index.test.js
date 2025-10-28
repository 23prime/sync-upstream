import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("@actions/exec");

describe("sync-upstream action", () => {
  let run;

  beforeEach(async () => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    vi.resetModules();

    // Setup default mocks
    vi.mocked(core.getInput).mockImplementation((name) => {
      const inputs = {
        "upstream-url": "https://github.com/test/upstream.git",
        "upstream-branch": "main",
        "target-branch": "main",
        "user-email": "test@example.com",
        "user-name": "Test User",
        "pr-title": "Test PR",
        "pr-body": "Test PR body",
        "pr-branch-prefix": "test-sync",
        "github-token": "fake-token",
      };
      return inputs[name] || "";
    });

    vi.mocked(exec.exec).mockResolvedValue(0);
    vi.mocked(core.info).mockImplementation(() => {});
    vi.mocked(core.warning).mockImplementation(() => {});
    vi.mocked(core.startGroup).mockImplementation(() => {});
    vi.mocked(core.endGroup).mockImplementation(() => {});
    vi.mocked(core.setFailed).mockImplementation(() => {});

    // Import the run function
    const module = await import("./index.js");
    run = module.run;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should set up git config correctly", async () => {
    // Mock no changes scenario
    vi.mocked(exec.exec).mockImplementation(async (cmd, args, options) => {
      if (args && args[0] === "rev-list") {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(Buffer.from("0\n"));
        }
      }
      return 0;
    });

    await run();

    expect(core.getInput).toHaveBeenCalledWith("upstream-url", { required: true });
    expect(exec.exec).toHaveBeenCalledWith("git", ["config", "--local", "user.name", "Test User"]);
    expect(exec.exec).toHaveBeenCalledWith("git", ["config", "--local", "user.email", "test@example.com"]);
  });

  it("should add upstream remote if it doesn't exist", async () => {
    // Mock upstream doesn't exist
    vi.mocked(exec.exec).mockImplementation(async (cmd, args, options) => {
      if (args && args[0] === "remote" && args[1] === "get-url") {
        throw new Error("upstream doesn't exist");
      }
      if (args && args[0] === "rev-list") {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(Buffer.from("0\n"));
        }
      }
      return 0;
    });

    await run();

    expect(exec.exec).toHaveBeenCalledWith("git", [
      "remote",
      "add",
      "upstream",
      "https://github.com/test/upstream.git",
    ]);
  });

  it("should update upstream remote if it exists", async () => {
    // Mock upstream exists
    vi.mocked(exec.exec).mockImplementation(async (cmd, args, options) => {
      if (args && args[0] === "remote" && args[1] === "get-url") {
        return 0; // upstream exists
      }
      if (args && args[0] === "rev-list") {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(Buffer.from("0\n"));
        }
      }
      return 0;
    });

    await run();

    expect(exec.exec).toHaveBeenCalledWith("git", [
      "remote",
      "set-url",
      "upstream",
      "https://github.com/test/upstream.git",
    ]);
  });

  it("should exit early when no changes detected", async () => {
    vi.mocked(exec.exec).mockImplementation(async (cmd, args, options) => {
      if (args && args[0] === "rev-list") {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(Buffer.from("0\n"));
        }
      }
      return 0;
    });

    await run();

    expect(core.info).toHaveBeenCalledWith("No new commits from upstream. Exiting.");
  });

  it("should create PR branch and merge successfully", async () => {
    const { default: github } = await import("@actions/github");
    const mockOctokit = {
      rest: {
        pulls: {
          create: vi.fn().mockResolvedValue({
            data: { number: 1, html_url: "https://github.com/test/repo/pull/1" },
          }),
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      },
    };
    vi.mocked(github.getOctokit).mockReturnValue(mockOctokit);
    Object.defineProperty(github.context, "runId", { value: 12345, writable: true });
    Object.defineProperty(github.context, "repo", { value: { owner: "test", repo: "repo" }, writable: true });

    vi.mocked(exec.exec).mockImplementation(async (cmd, args, options) => {
      if (args && args[0] === "rev-list") {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(Buffer.from("5\n"));
        }
      }
      return 0;
    });

    await run();

    expect(exec.exec).toHaveBeenCalledWith("git", ["checkout", "-b", "test-sync-12345"]);
    expect(exec.exec).toHaveBeenCalledWith("git", ["merge", "--allow-unrelated-histories", "upstream/main"]);
    expect(exec.exec).toHaveBeenCalledWith("git", ["push", "-u", "origin", "test-sync-12345"]);
    expect(mockOctokit.rest.pulls.create).toHaveBeenCalledWith({
      owner: "test",
      repo: "repo",
      title: "Test PR",
      body: "Test PR body",
      head: "test-sync-12345",
      base: "main",
    });
  });

  it("should fail when merge has conflicts", async () => {
    vi.mocked(exec.exec).mockImplementation(async (cmd, args, options) => {
      if (args && args[0] === "rev-list") {
        if (options?.listeners?.stdout) {
          options.listeners.stdout(Buffer.from("5\n"));
        }
        return 0;
      }
      if (args && args[0] === "merge") {
        throw new Error("Merge conflict");
      }
      return 0;
    });

    await run();

    expect(core.setFailed).toHaveBeenCalledWith("Merge failed with conflicts: Merge conflict");
  });
});
