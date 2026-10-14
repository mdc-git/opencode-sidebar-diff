# OpenCode Sidebar Diff

An OpenCode V2 TUI plugin that adds a live `Changes` section to the session sidebar. It lists changed files, shows additions and deletions, and opens a selected file in OpenCode's built-in diff viewer.

This package is installed from its GitHub repository. It is not published as an npm package.

## Requirements

- OpenCode V2.
- Bun for installation and development commands.
- A Git repository for live change notifications.

The plugin watches the project working tree and Git metadata locally. It does not require an external service or credentials.

## Global GitHub installation

Add the Git package to your global OpenCode configuration at `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "opencode-sidebar-diff@git+https://github.com/mdc-git/opencode-sidebar-diff.git"
  ]
}
```

OpenCode loads the server and TUI entrypoints from the package together. You do not need to add this plugin separately to `cli.json`.

## Local checkout

For local development or testing the current source, clone the repository and install its dependencies:

```sh
git clone https://github.com/mdc-git/opencode-sidebar-diff.git
cd opencode-sidebar-diff
bun install --frozen-lockfile
```

Add the checkout to the `plugins` array in the project `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "/absolute/path/to/opencode-sidebar-diff"
  ]
}
```

Replace the example path with the checkout's absolute path. Use this entry instead of the GitHub package entry while developing locally.

Restart OpenCode after adding the configuration.

## Usage

Start OpenCode with the plugin enabled, then open a session in a Git repository:

1. Change, add, or delete a file in the working tree.
2. Find the `Changes` section in the session sidebar.
3. Click a file to open its diff.
4. Close the diff with `Escape`, `q`, or the `× close` button.

The sidebar refreshes when working-tree files change and when Git branch metadata changes. It shows `+` for added files, `-` for deleted files, and `~` for modified files, followed by the line counts.

## Development

Run the repository check:

```sh
bun install --frozen-lockfile
bun run check
```

The package exports `index.ts` as its server entrypoint and `tui.tsx` as its TUI entrypoint. There is no separate build command in this repository.

## How it works

- `index.ts` watches the project and Git metadata, then emits a change event.
- `tui.tsx` reads the current session's VCS status and renders the sidebar section.
- `rpc.ts` defines the server-to-TUI change event used for live refreshes.

The server-side watcher is skipped when the OpenCode project is not inside a Git repository.
