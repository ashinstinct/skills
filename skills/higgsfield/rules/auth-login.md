# Higgsfield Authentication & Login

## Overview

Higgsfield authentication is managed entirely by the MCP server using the user's stored session. There is no explicit login step, no API key to manage in code, and no OAuth flow to implement.

## Checking authentication status

Call `balance` to confirm the active session and retrieve account info:

```
mcp: balance
```

Response fields:
- `email` — the authenticated user's email address
- `credits` — remaining generation credits
- `subscription_plan_type` — e.g. `"creator"`, `"pro"`, `"free"`

If the MCP server is not authenticated, the call will return an error. In that case, the user must re-authenticate through the Higgsfield MCP server configuration.

## Workspace context

All MCP operations run in the context of a workspace. The default is the user's private workspace.

**List available workspaces:**
```
mcp: list_workspaces
```

Response includes an array of workspaces, each with:
- `id` — UUID to pass to `select_workspace`
- `name` — human-readable name
- `is_selected` — `true` for the currently active workspace

**Switch to a team or shared workspace:**
```
mcp: select_workspace
  workspace_id: "<uuid from list_workspaces>"
```

**Return to the private workspace:**
```
mcp: select_workspace
  clear: true
```

The workspace selection persists across sessions until explicitly changed.

## No client-side auth code needed

The Higgsfield MCP server handles token storage and refresh. When building applications that call Higgsfield's REST API directly (outside the MCP layer), use a Higgsfield API key obtained from the Higgsfield dashboard. Pass it as a Bearer token:

```http
Authorization: Bearer <your-api-key>
```

For MCP-based workflows (Claude tool use), no additional auth setup is required.
