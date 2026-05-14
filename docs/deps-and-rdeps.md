# Deps & Reverse Deps

Status: **Implemented**

## Overview

Two query tools for exploring the Bazel dependency graph. `deps` lists what a target depends on; `rdeps` lists what depends on a target within a given scope.

## Tools

### `bazel_ios_deps`

List dependencies of a Bazel target. Runs `bazel query "deps(<target>)"`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel target label |
| `depth` | number | no | Maximum depth to traverse (maps to `deps(<target>, <depth>)`) |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra Bazel query args |
| `timeoutSeconds` | number | no | Query timeout (default: 300) |

### `bazel_ios_rdeps`

List reverse dependencies of a target within a scope. Runs `bazel query "rdeps(<scope>, <target>)"`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel target label |
| `scope` | string | no | Scope for the rdeps search (default: `//...`) |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra Bazel query args |
| `timeoutSeconds` | number | no | Query timeout (default: 300) |

## CLI

```sh
xcodebazelmcp deps //app:app
xcodebazelmcp deps //app:app --depth 2
xcodebazelmcp rdeps //modules/Models:ModelsLib --scope "//modules/..."
xcodebazelmcp rdeps //modules/Models:ModelsLib
```

## Implementation

- `deps` builds the query expression `deps(<target>)` or `deps(<target>, <depth>)` when depth is specified, then runs it via `bazel query`.
- `rdeps` builds `rdeps(<scope>, <target>)` and runs it via `bazel query`.
- Both return the list of matching labels, one per line.
- Results are passed through `runBazel` with the configured startup args and timeout.
