---
title: "MCP & AI Assistants"
description: "Connect Claude and other AI tools to your Vektra workspace through the hosted MCP connector"
sidebarTitle: "MCP & AI Assistants"
---

Vektra ships a **hosted MCP connector** that lets AI assistants like Claude read and manage your workspace directly — list submissions, review tickets, update email templates, and more — without any local setup.

## What is MCP?

MCP (Model Context Protocol) is the standard way AI assistants connect to external tools. Vektra exposes its public API as MCP tools over a hosted endpoint, so an assistant can act on your label's data with your permission.

Everything runs from the Dashboard deployment — no extra server to host, no local process.

## Connecting Claude (one click)

The connector uses **OAuth with Discord**, so staff can sign in without copying keys around.

1. Open **Claude** (Desktop, claude.ai, or Cowork) and add a custom connector.
2. Enter the connector URL:
   ```
   https://dashboard.vektra.games/api/mcp
   ```
3. Sign in with **Discord** and pick the workspace (server) you manage.
4. The connector appears with Vektra's tools ready to use.

## Connecting with an API key

Prefer a plain key? Use the same URL with bearer-token auth:

```http
Authorization: Bearer vk_your_key_here
```

Generate the key in **Dashboard → Developer → API Keys**. A **workspace key** unlocks every tool; a **person key** is scoped to one artist's own submissions, analytics, and tickets.

## Available tools

| Tool | What it does |
|---|---|
| `list_submissions` | List demo submissions, newest first. |
| `create_submission` | Submit a demo on behalf of an artist. |
| `delete_submission` | Permanently delete a submission by ID. |
| `get_analytics` | Status/rating breakdowns, activity, top artists. |
| `list_releases` | List release packages queued for QC. |
| `list_tickets` | List support tickets. |
| `create_ticket` | Open a support ticket. |
| `delete_ticket` | Permanently delete a ticket by ID. |
| `list_webhooks` | List webhook subscriptions and delivery status. |
| `subscribe_webhook` | Subscribe a URL to workspace events. |
| `unsubscribe_webhook` | Remove a webhook subscription. |
| `get_email_settings` | Read the workspace email template, reply address, and Resend status. |
| `update_email_template` | Set the custom HTML email template and/or reply address. |
| `get_api_guide` | Return the full public API reference. |
| `get_mailing_guide` | Explain how artist emailing works (Resend, reply links, placeholders). |

## Scoping and security

- Every MCP request is authenticated with your bearer token — the same credential the tools use to call the API, so a connection can only see what its key is allowed to see.
- **Workspace keys** see the whole label; **person keys** only see the bound person's data. Workspace-level tools (webhooks, releases, email settings) are rejected for person keys.
- The OAuth flow binds the connection to the logged-in user's chosen label with the same scoping rules.
- Connections are stateless — nothing is installed on your machine and no local process is needed.

## OAuth details (for advanced setups)

The connector is a standard MCP streamable-HTTP server with RFC 8414 authorization-server metadata:

```
https://dashboard.vektra.games/.well-known/oauth-authorization-server
```

Clients that support OAuth discovery (Claude Desktop, claude.ai, Cowork) use it automatically. Everything else can authenticate with a bearer API key.

## See also

- [Developer API](/api) — the full HTTP API reference these tools are built on.
- [Email & artist notifications](/email) — how artist emails, reply links, and templates work.
