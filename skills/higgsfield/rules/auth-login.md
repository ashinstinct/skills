# Higgsfield Authentication & Login

## Overview

Higgsfield supports two authentication paths:

| Path | When to use |
|---|---|
| **CLI** (`higgsfield auth login`) | Running shell commands, using the `higgsfield` CLI |
| **MCP server** (automatic) | Claude tool-use via the Higgsfield MCP server |

---

## CLI authentication

### Install the CLI

```bash
curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh
```

### Log in

```bash
higgsfield auth login
```

This opens a browser window. Complete the login flow, then return to the terminal — the CLI stores the session token automatically.

### Check status

```bash
higgsfield account status
```

Prints the authenticated email, plan, and remaining credits. If the output shows `Session expired` or `Not authenticated`, re-run `higgsfield auth login`.

### Session expiry

Tokens expire. If any `higgsfield` command returns `Session expired`, run:

```bash
higgsfield auth login
```

Wait for the user to confirm they've completed the browser flow before continuing.

---

## MCP server authentication

When using the Higgsfield MCP server (Claude tool use), authentication is managed automatically by the server — no CLI login is needed.

Verify the active session:

```
mcp: balance
```

Returns `email`, `credits`, and `subscription_plan_type`. If the call fails, the user must re-authenticate through the Higgsfield MCP server configuration.

---

## Workspace context (MCP)

All MCP operations target the currently selected workspace (default: private workspace).

**List workspaces:**
```
mcp: list_workspaces
```

**Switch workspace:**
```
mcp: select_workspace
  workspace_id: "<id from list_workspaces>"
```

**Reset to private workspace:**
```
mcp: select_workspace
  clear: true
```

The selection persists across sessions until changed.

---

## Direct REST API (no CLI or MCP)

For applications calling the Higgsfield REST API directly, obtain an API key from the Higgsfield dashboard and pass it as a Bearer token:

```http
Authorization: Bearer <your-api-key>
```
