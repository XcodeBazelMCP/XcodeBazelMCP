# Bazel Clean

Status: **Implemented**

## Overview

Utility tool to clean Bazel build artifacts. Wraps `bazel clean` with an optional `--expunge` flag.

## Tool

### `bazel_ios_clean`

Clean Bazel build outputs in the configured workspace.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `expunge` | boolean | no | If true, runs `bazel clean --expunge` (removes entire output base). Default: false. |
| `startupArgs` | string[] | no | Bazel startup args. |

## CLI

```sh
xcodebazelmcp clean
xcodebazelmcp clean --expunge
```

## Implementation

Runs `bazel clean` or `bazel clean --expunge` via `runBazel`. Expunge removes the entire output base directory including all cached results — use when disk space is low or builds are corrupted.
