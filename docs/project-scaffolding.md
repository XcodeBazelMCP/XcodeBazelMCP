# Project Scaffolding

Status: **Implemented**

## Overview

Two MCP tools for scaffolding new Bazel-based Apple projects from templates. Generates a complete, buildable workspace with all necessary configuration files and a SwiftUI starter app.

## Tools

### `bazel_scaffold`

Create a new Bazel project from a template.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `outputPath` | string | yes | Directory to create the project in |
| `name` | string | yes | Project name |
| `template` | string | yes | Template: `ios_app`, `ios_test`, `ios_app_with_tests`, `macos_app`, `macos_test`, `macos_app_with_tests` |
| `bundleId` | string | no | Bundle identifier (default: `com.example.<name>`) |
| `minimumOs` | string | no | Minimum OS version |
| `rulesVersion` | string | no | `rules_apple` version to pin in MODULE.bazel |

### `bazel_scaffold_list_templates`

List all available scaffolding templates with descriptions.

No parameters.

## Templates

| Template | Description |
|---|---|
| `ios_app` | iOS SwiftUI application |
| `ios_test` | iOS unit test target |
| `ios_app_with_tests` | iOS app + unit tests |
| `macos_app` | macOS SwiftUI application |
| `macos_test` | macOS unit test target |
| `macos_app_with_tests` | macOS app + unit tests |

## Generated Files

```
<outputPath>/
├── MODULE.bazel          # Bzlmod module with rules_apple dependency
├── .bazelrc              # Common build flags
├── .bazelversion         # Pinned Bazel version
├── .gitignore            # Bazel output directories
├── BUILD.bazel           # App and/or test targets
├── Sources/
│   ├── App.swift         # SwiftUI @main entry point
│   └── ContentView.swift # Starter ContentView
├── Info.plist            # App Info.plist
└── .xcodebazelmcp/
    └── config.yaml       # Workspace config for this MCP server
```

## CLI

```sh
xcodebazelmcp new ios_app MyApp -o ~/Projects
xcodebazelmcp new ios_app_with_tests MyApp --bundle-id com.myorg.myapp
xcodebazelmcp templates
```

## Implementation

- Guards against overwriting existing Bazel workspaces — fails if `MODULE.bazel` or `WORKSPACE` already exists in the output directory.
- Templates are embedded in the source and rendered with the provided parameters (name, bundleId, minimumOs, rulesVersion).
- The generated `.xcodebazelmcp/config.yaml` pre-configures the workspace path so the MCP server works immediately in the new project.
