# App Path & Bundle ID

Status: **Implemented**

## Overview

Two utility tools for locating built app bundles and extracting bundle identifiers. Used as building blocks by higher-level tools like `build_and_run`.

## Tools

### `bazel_ios_get_app_path`

Find the `.app` bundle path for a Bazel target in `bazel-bin`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `target` | string | yes | Bazel target label (e.g. `//app:app`) |

Returns the absolute path to the `.app` bundle. The target must have been built first.

### `bazel_ios_get_bundle_id`

Read the `CFBundleIdentifier` from an app's `Info.plist`.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `appPath` | string | yes | Path to the `.app` bundle or a Bazel target label |

Returns the bundle identifier string (e.g. `com.example.MyApp`).

## CLI

```sh
xcodebazelmcp app-path //app:app
xcodebazelmcp bundle-id /path/to/MyApp.app
xcodebazelmcp bundle-id //app:app
```

## Implementation

- `get_app_path` uses `bazel cquery '<target>' --output=files` to discover output paths, then scans for `.app` bundles. Falls back to globbing `bazel-bin/` using the target's package path if cquery fails.
- `get_bundle_id` accepts either an absolute `.app` path or a Bazel target label (in which case it resolves the app path first). Reads `Info.plist` inside the bundle using `plutil -convert json` and extracts the `CFBundleIdentifier` value.
- Both return an error if the target hasn't been built yet.
