# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < 0.1.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in XcodeBazelMCP, please report it responsibly:

1. **Do not** open a public GitHub issue.
2. Email **maatheusgois@gmail.com** with a description of the vulnerability, steps to reproduce, and any relevant logs or screenshots.
3. You can expect an initial response within **48 hours**.
4. We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Scope

XcodeBazelMCP is a local CLI and MCP server that spawns Bazel and Xcode toolchain processes on your machine. It does not handle authentication, network services, or user data. Security concerns are primarily around:

- Command injection via tool arguments
- Unintended file system access
- Dependency supply chain risks
