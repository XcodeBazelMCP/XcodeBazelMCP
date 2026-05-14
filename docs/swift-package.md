# Swift Package Manager

Status: **Implemented**

## Overview

Seven MCP tools for working with Swift Package Manager projects. Covers the full SPM lifecycle: build, test, run, clean, dependency resolution, manifest inspection, and project scaffolding — independent of Bazel.

## Tools

### `swift_package_build`

Build a Swift package.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `packagePath` | string | no | Path to the package directory (default: workspace root) |
| `configuration` | string | no | `debug` or `release` (default: `debug`) |
| `target` | string | no | Specific target to build |
| `extraArgs` | string[] | no | Extra `swift build` args |
| `timeoutSeconds` | number | no | Build timeout |
| `streaming` | boolean | no | Stream build output incrementally |

### `swift_package_test`

Run tests in a Swift package.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `packagePath` | string | no | Path to the package directory |
| `filter` | string | no | Test filter expression |
| `configuration` | string | no | `debug` or `release` |
| `extraArgs` | string[] | no | Extra `swift test` args |
| `timeoutSeconds` | number | no | Test timeout |
| `streaming` | boolean | no | Stream test output incrementally |

### `swift_package_run`

Build and run an executable target in a Swift package.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `packagePath` | string | no | Path to the package directory |
| `executable` | string | no | Executable product name |
| `configuration` | string | no | `debug` or `release` |
| `extraArgs` | string[] | no | Extra `swift run` args |
| `runArgs` | string[] | no | Arguments passed to the executable |
| `timeoutSeconds` | number | no | Run timeout |

### `swift_package_clean`

Clean Swift package build artifacts.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `packagePath` | string | no | Path to the package directory |

### `swift_package_resolve`

Resolve package dependencies.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `packagePath` | string | no | Path to the package directory |
| `timeoutSeconds` | number | no | Resolve timeout |

### `swift_package_dump`

Dump the parsed `Package.swift` manifest as JSON.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `packagePath` | string | no | Path to the package directory |

### `swift_package_init`

Initialize a new Swift package.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `packagePath` | string | no | Directory to create the package in |
| `type` | string | no | `library`, `executable`, or `tool` |
| `name` | string | no | Package name |

## CLI

```sh
xcodebazelmcp spm-build                       # alias: swift-build
xcodebazelmcp spm-test --filter "MyTests"      # alias: swift-test
xcodebazelmcp spm-run --executable mytool      # alias: swift-run
xcodebazelmcp spm-clean                        # alias: swift-clean
xcodebazelmcp spm-resolve                      # alias: swift-resolve
xcodebazelmcp spm-dump                         # alias: swift-dump
xcodebazelmcp spm-init --type executable --name MyTool  # alias: swift-init
```

## Implementation

- All tools run `swift` CLI commands (`swift build`, `swift test`, `swift run`, `swift package clean`, `swift package resolve`, `swift package dump-package`, `swift package init`).
- Validates `Package.swift` presence via `assertSwiftPackage()` before running commands (except `swift_package_init`).
- Streaming is supported for `build` and `test` using the same streaming infrastructure.
- `swift_package_dump` parses the output of `swift package dump-package` and returns the manifest as structured JSON.
