# opencode-sidebar-diff

`opencode-sidebar-diff` is an OpenCode V2 TUI plugin that adds a live `Changes` section to the session sidebar. It lists changed files, shows additions and deletions, and opens a selected file in OpenCode's built-in diff viewer.

This repository is a private local plugin package. Install it from a checkout by path rather than from a package registry.

## Requirements

- [OpenCode V2](https://opencode.ai/v2/docs/) with TUI plugin support.
- A Git repository for live change notifications.
- [Bun](https://bun.sh/) for installing the checkout's dependencies and running its type check.

The plugin watches the project working tree and Git metadata locally. It does not require an external service or credentials.

## Installation

Clone the repository and install its dependencies:

```sh
git clone https://github.com/mdc-git/opencode-sidebar-diff.git
cd opencode-sidebar-diff
bun install
```

Add the checkout to the `plugins` array in your project's `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "/absolute/path/to/opencode-sidebar-diff"
  ]
}
```

Replace the example path with the checkout's absolute path. OpenCode loads the server entrypoint and the TUI entrypoint from the same package. You do not need to add this plugin separately to `cli.json`.

Restart OpenCode after adding the configuration.

## Quick start

1. Open a Git repository in OpenCode and start or open a session.
2. Change, add, or delete a file in the working tree.
3. Find the `Changes` section in the session sidebar.
4. Click a file to open its diff.
5. Close the diff with `Escape`, `q`, or the `× close` button.

The sidebar refreshes when working-tree files change and when Git branch metadata changes. It shows `+` for added files, `-` for deleted files, and `~` for modified files, followed by the line counts.

## Development

After installing dependencies, run the type check:

```sh
bun run check
```

The package exports `index.ts` as its server entrypoint and `tui.tsx` as its TUI entrypoint. There is no separate build command in this repository.

## How it works

- `index.ts` watches the project and Git metadata, then emits a change event.
- `tui.tsx` reads the current session's VCS status and renders the sidebar section.
- `rpc.ts` defines the server-to-TUI change event used for live refreshes.

The server-side watcher is skipped when the OpenCode project is not inside a Git repository.
