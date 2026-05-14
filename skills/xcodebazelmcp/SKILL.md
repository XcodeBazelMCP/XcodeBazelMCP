# XcodeBazelMCP

Use XcodeBazelMCP when working with Bazel-based iOS projects.

Prefer:

- `bazel_ios_discover_targets` before guessing app or test labels.
- `bazel_ios_build` for compile-only feedback.
- `bazel_ios_test` for iOS unit/UI/build tests.
- `bazel_ios_health` when simulator, Xcode, or Bazel behavior looks environment-related.

Default to the workspace in `BAZEL_IOS_WORKSPACE` or the current working directory.
