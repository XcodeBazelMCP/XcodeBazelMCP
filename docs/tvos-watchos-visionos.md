# tvOS, watchOS & visionOS Targets

Status: **Implemented**

## Overview

Build, run, test, and discover targets for tvOS, watchOS, and visionOS platforms. Each platform exposes four tools following the same pattern as iOS and macOS. All share a common handler that extracts the platform from the tool name and applies the correct CPU flags.

## Tools

Each platform (`tvos`, `watchos`, `visionos`) provides four tools with identical parameter shapes.

### `bazel_<platform>_build`

Build a Bazel target for the specified platform.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel target label |
| `buildMode` | string | no | `debug` or `release` |
| `configs` | string[] | no | Bazel `--config` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra `bazel build` args |
| `timeoutSeconds` | number | no | Build timeout |
| `streaming` | boolean | no | Stream build output incrementally |

### `bazel_<platform>_run`

Build and run a target for the specified platform.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel target label |
| `buildMode` | string | no | `debug` or `release` |
| `configs` | string[] | no | Bazel `--config` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra `bazel build` args |
| `runArgs` | string[] | no | Arguments passed to the executable |
| `timeoutSeconds` | number | no | Run timeout |
| `streaming` | boolean | no | Stream output incrementally |

### `bazel_<platform>_test`

Run tests for the specified platform.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel test target label |
| `testFilter` | string | no | Test filter expression |
| `configs` | string[] | no | Bazel `--config` flags |
| `startupArgs` | string[] | no | Bazel startup args |
| `extraArgs` | string[] | no | Extra `bazel test` args |
| `timeoutSeconds` | number | no | Test timeout |
| `streaming` | boolean | no | Stream test output incrementally |

### `bazel_<platform>_discover_targets`

Discover targets for the specified platform.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `scope` | string | no | Bazel package pattern (default: `//...`) |
| `kind` | string | no | Filter kind (e.g. `tvos_apps`, `tvos_tests`, `tvos_all`) |
| `extraArgs` | string[] | no | Extra query args |
| `startupArgs` | string[] | no | Bazel startup args |

## Platform Flags

| Platform | CPU Flag |
|---|---|
| tvOS | `--tvos_cpus=sim_arm64` |
| watchOS | `--watchos_cpus=arm64` |
| visionOS | `--visionos_cpus=sim_arm64` |

## Discovery Rule Kinds

| Platform | App Rule | Test Rule |
|---|---|---|
| tvOS | `tvos_application` | `tvos_unit_test` |
| watchOS | `watchos_application` | `watchos_unit_test` |
| visionOS | `visionos_application` | `visionos_unit_test` |

## CLI

```sh
# tvOS
xcodebazelmcp tvos-build //app:tvapp
xcodebazelmcp tvos-run //app:tvapp --stream
xcodebazelmcp tvos-test //tests:tv_tests
xcodebazelmcp tvos-discover

# watchOS
xcodebazelmcp watchos-build //app:watchapp
xcodebazelmcp watchos-run //app:watchapp
xcodebazelmcp watchos-test //tests:watch_tests
xcodebazelmcp watchos-discover --kind watchos_apps

# visionOS
xcodebazelmcp visionos-build //app:visionapp
xcodebazelmcp visionos-run //app:visionapp --stream
xcodebazelmcp visionos-test //tests:vision_tests
xcodebazelmcp visionos-discover
```

## Implementation

- All three platforms share the same handler pattern. The platform is extracted from the tool name prefix (e.g. `bazel_tvos_build` → `tvos`) and the corresponding CPU flag is applied automatically.
- Discovery queries `rules_apple` rule kinds for the resolved platform.
- Streaming support uses the same infrastructure as iOS/macOS tools.
