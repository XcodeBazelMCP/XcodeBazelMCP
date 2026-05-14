# Daemon

Status: **Implemented**

## Overview

A per-workspace background daemon that tracks active operations and provides a coordination point for concurrent MCP sessions. Communicates over a Unix domain socket using a JSON protocol.

## Tools

### `bazel_daemon_start`

Start the daemon for the current workspace (or confirm it is already running).

No parameters.

### `bazel_daemon_stop`

Stop the running daemon.

No parameters.

### `bazel_daemon_status`

Query daemon health and active operations.

No parameters. Returns PID, uptime, and list of active operations.

## CLI

```sh
xcodebazelmcp daemon            # run daemon in foreground (for debugging)
xcodebazelmcp daemon-start      # start daemon in background
xcodebazelmcp daemon-stop       # stop daemon
xcodebazelmcp daemon-status     # print PID, uptime, active ops
```

## Socket & PID Files

- Unix socket: `/tmp/xbmcp-daemon-<hash>.sock` (hash derived from workspace path)
- PID file: `~/.xcodebazelmcp/daemons/<hash>.pid`

## JSON Protocol

Messages are newline-delimited JSON objects over the Unix socket.

| Method | Description |
|---|---|
| `ping` | Health check, returns `pong` |
| `status` | Returns PID, uptime, active operation count |
| `list_ops` | List active operations with metadata |
| `register_op` | Register a new active operation |
| `unregister_op` | Remove a completed operation |
| `shutdown` | Gracefully shut down the daemon |

## Implementation

- The `daemon-start` client spawns a detached child process that listens on the Unix socket.
- PID file is written on startup and removed on shutdown.
- Auto-cleanup on `SIGTERM` / `SIGINT`: removes socket and PID file, then exits.
- `daemon-status` connects to the socket, sends a `status` message, and prints the response. If the socket is unreachable, reports the daemon as not running.
