# SwiftUI App with Bazel — iOS + macOS

This is a multi-platform application (iOS + macOS) written in SwiftUI and built via Bazel. Demonstrates how XcodeBazelMCP works with both iOS simulator/device and macOS targets.

## Getting Started

Install Bazelisk via `brew install bazelisk`. `bazel` & `bazelisk` will now use the `.bazelversion` file to download and run the chosen Bazel version.

### Generate/Open Project

```bash
bazel run :xcodeproj
open App.xcodeproj
```

### Build iOS Application

```bash
bazel build //app
# or via XcodeBazelMCP:
xcodebazelmcp build //app:app --debug
```

### Build macOS Application

```bash
bazel build //mac
# or via XcodeBazelMCP:
xcodebazelmcp macos-build //mac:mac --debug
```

### Run All iOS Tests

```bash
bazel test $(bazel query 'kind(ios_unit_test,//...)')
# or via XcodeBazelMCP:
xcodebazelmcp test //modules/API:APITests
xcodebazelmcp test //modules/Models:ModelsTests
```

### Run macOS Tests

```bash
bazel test //mac:MacTests
# or via XcodeBazelMCP:
xcodebazelmcp macos-test //mac:MacTests
```

### Using Profiles

```bash
xcodebazelmcp defaults --profile app    # iOS app profile
xcodebazelmcp defaults --profile mac    # macOS app profile
```

### Discover All Targets

```bash
xcodebazelmcp discover                  # iOS targets
xcodebazelmcp macos-discover            # macOS targets
```

If the tests fail, run `xcrun simctl list devices` to check what devices and OS versions are locally available. iOS version is set in [`shared.bzl`](/tools/shared.bzl).

## Project Structure

```
├── app/                  # iOS SwiftUI application
│   ├── source/           # App source files
│   └── BUILD.bazel       # ios_application target
├── mac/                  # macOS SwiftUI application
│   ├── source/           # Mac app source files
│   ├── Tests/            # macOS unit tests
│   └── BUILD.bazel       # macos_application + macos_unit_test targets
├── modules/
│   ├── API/              # Shared API module (iOS)
│   └── Models/           # Shared Models module (iOS)
├── tools/
│   └── shared.bzl        # App info, version constants
└── .xcodebazelmcp/
    └── config.yaml       # XcodeBazelMCP profiles (app, mac, models, mac-tests)
```

## Underlying Tools

- [`rules_apple`](https://github.com/bazelbuild/rules_apple)
- [`rules_swift`](https://github.com/bazelbuild/rules_swift)
- [`rules_xcodeproj`](https://github.com/buildbuddy-io/rules_xcodeproj)

## Making It Your Own

`tools/shared.bzl` contains definitions for app name, bundle identifier, and platform versions. Update these values to change the application's name.
