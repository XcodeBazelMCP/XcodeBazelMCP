# Config File & Session Defaults

Status: **Implemented**

## Config File

On startup the server loads the first config file found in this order:

1. `<workspace>/.xcodebazelmcp/config.yaml`
2. `<workspace>/.xcodebazelmcp/config.yml`
3. `~/.xcodebazelmcp/config.yaml`
4. `~/.xcodebazelmcp/config.yml`

Environment variables (`BAZEL_IOS_WORKSPACE`, `BAZEL_PATH`, `BAZEL_IOS_MCP_MAX_OUTPUT`) always take precedence over the config file.

### Supported Keys

| Key | Type | Description |
|---|---|---|
| `workspacePath` | string | Absolute path to the Bazel workspace. |
| `bazelPath` | string | Path to the `bazel` binary. |
| `maxOutput` | number | Maximum output bytes per command. |
| `defaultSimulatorName` | string | Default simulator device name. |
| `defaultPlatform` | string | Default platform (`simulator` or `device`). |
| `defaultBuildMode` | string | Default build mode (`debug`, `release`, etc.). |
| `defaultTarget` | string | Default Bazel target label. |

### Example

```yaml
workspacePath: /path/to/your/ios-workspace
bazelPath: /opt/homebrew/bin/bazel
defaultSimulatorName: iPhone 16 Pro
defaultPlatform: simulator
defaultBuildMode: debug
defaultTarget: //app:app
```

## Session Defaults

Session defaults are in-memory overrides set at runtime. They persist for the lifetime of the MCP server process.

### `bazel_ios_set_defaults`

Set one or more defaults:

| Parameter | Type | Description |
|---|---|---|
| `target` | string | Default Bazel target. |
| `simulatorName` | string | Default simulator name. |
| `simulatorId` | string | Default simulator UDID. |
| `buildMode` | string | Default build mode. |
| `platform` | string | Default platform. |
| `clear` | boolean | Clear all session defaults. |

### `bazel_ios_show_defaults`

Shows current workspace config, config file path (if loaded), and session defaults.

### CLI

```sh
# Show current config and defaults
xcodebazelmcp defaults

# Set defaults
xcodebazelmcp set-defaults --target //app:app --simulator-name "iPhone 16 Pro" --build-mode debug

# Clear all defaults
xcodebazelmcp set-defaults --clear
```

## Priority Order

1. Explicit tool arguments (always win)
2. Session defaults (set via `bazel_ios_set_defaults`)
3. Config file defaults (`defaultSimulatorName`, etc.)
4. Environment variables
5. Built-in defaults (`process.cwd()`, `bazel`, `200000`)
