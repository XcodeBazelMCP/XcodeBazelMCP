# Test Coverage

Status: **Implemented**

## Overview

Runs Bazel test coverage and parses the lcov output to produce a human-readable coverage report. Wraps `bazel coverage` with automatic lcov file discovery and parsing.

## Tool

### `bazel_ios_test_coverage`

Run coverage for a Bazel test target and return parsed results.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel test target label (e.g. `//modules/API:APITests`) |
| `testFilter` | string | no | Filter expression to run a subset of tests |
| `configs` | string[] | no | Extra `--config=` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra Bazel args appended after `--` |
| `timeoutSeconds` | number | no | Timeout for the coverage run (default: 1800) |

## CLI

```sh
xcodebazelmcp coverage //modules/API:APITests
xcodebazelmcp coverage //modules/API:APITests --filter "testFetch"
```

## Implementation

1. Runs `bazel coverage <target>` with `--combined_report=lcov`.
2. Locates the generated `coverage.dat` file under `bazel-testlogs/`.
3. Parses the lcov data to extract per-file line coverage percentages.
4. Returns structured output with overall coverage percentage and per-file breakdown.
