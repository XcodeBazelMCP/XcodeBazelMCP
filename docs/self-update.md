# Self-Update

Status: **Implemented**

## Overview

Two MCP tools for checking and performing upgrades of the XcodeBazelMCP installation. Auto-detects the install method from the binary path and runs the appropriate upgrade command.

## Tools

### `bazel_check_update`

Check the npm registry for the latest published version and compare with the currently installed version.

No parameters.

### `bazel_upgrade`

Upgrade to the latest version.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `method` | string | no | Install method override: `npm-global`, `npm-local`, `homebrew`, or `source`. Auto-detected if omitted. |

## Upgrade Commands

| Method | Command |
|---|---|
| `npm-global` | `npm install -g xcodebazelmcp@latest` |
| `npm-local` | `npm update xcodebazelmcp` |
| `homebrew` | `brew upgrade xcodebazelmcp` |
| `source` | `git pull && npm install && npm run build` |

## CLI

```sh
xcodebazelmcp check-update
xcodebazelmcp upgrade              # auto-detect method
xcodebazelmcp upgrade --method homebrew
```

Aliases: `update`, `self-update` (both map to `upgrade`).

## Implementation

- `bazel_check_update` fetches the latest version from the npm registry (`https://registry.npmjs.org/xcodebazelmcp/latest`) and compares it against the running version from `package.json`.
- `bazel_upgrade` auto-detects the install method by inspecting the resolved binary path:
  - Contains `/lib/node_modules/` → `npm-global`
  - Contains `node_modules/` → `npm-local`
  - Contains `/Cellar/` or `/homebrew/` → `homebrew`
  - Otherwise → `source`
- The `method` parameter can override auto-detection.
