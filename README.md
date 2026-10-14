# OpenCode Sidebar Diff

An OpenCode V2 plugin for reviewing Git changes from the session sidebar.

It lists changed files with their status and line counts. Selecting a file opens OpenCode's built-in
diff viewer.

## Features

- Adds a live `Changes` section to the session sidebar.
- Shows added, deleted, and modified files with addition and deletion counts.
- Opens a selected file in OpenCode's built-in diff viewer.
- Refreshes when working-tree files or Git branch metadata changes.

## Requirements

- OpenCode V2.
- Bun for installation and development commands.
- A Git repository for live change notifications.

## Global GitHub installation

Add the Git package to your global OpenCode configuration at
`~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    "opencode-sidebar-diff@git+https://github.com/mdc-git/opencode-sidebar-diff.git"
  ]
}
```

OpenCode loads the package's server and TUI entrypoints together.

## Usage

Start OpenCode with the plugin enabled and open a session in a Git repository:

1. Change, add, or delete a file in the working tree.
2. Find the `Changes` section in the session sidebar.
3. Click a file to open its diff.
4. Close the diff with `Escape`, `q`, or the `× close` button.

The sidebar refreshes when working-tree files change and when Git branch metadata changes. It shows
`+` for added files, `-` for deleted files, and `~` for modified files, followed by the line counts.

## Local checkout

For local development or testing the current source, clone the repository and install its
dependencies:

```sh
git clone https://github.com/mdc-git/opencode-sidebar-diff.git
cd opencode-sidebar-diff
bun install --frozen-lockfile
```

Load the checkout from the project `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": [
    {
      "package": "/absolute/path/to/opencode-sidebar-diff"
    }
  ]
}
```

Replace the example path with the checkout's absolute path. Use this entry instead of the GitHub
package entry while developing locally.

Restart OpenCode after adding the configuration.

## Development

Install dependencies:

```sh
bun install --frozen-lockfile
```

Run the repository check:

```sh
bun run check
```

The package exports `index.ts` as its server entrypoint and `tui.tsx` as its TUI entrypoint. There is
no separate build command in this repository.
