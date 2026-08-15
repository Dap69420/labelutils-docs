# Vektra API Documentation

Welcome to the **Vektra Developer API** — the official API for receiving and managing demo submissions, support tickets, releases, and email automation through your own website, app, or AI assistant.

---

## Base URL

```
https://dashboard.vektra.games/api/v1
```

---

## Authentication

All API requests must include your API key in the request headers.

```http
X-API-Key: vk_your_key_here
```

Or as a Bearer token:

```http
Authorization: Bearer vk_your_key_here
```

> **Generate your API key** from the Dashboard → Developer → API Keys tab.

### Scoping

Vektra issues two kinds of keys:

| Key type | What it can access |
|---|---|
| **Workspace key** | Everything in the label: submissions, analytics, tickets, releases, webhooks, and email settings. |
| **Person key** | Bound to one artist's email — only that person's own submissions, analytics, and tickets. Cannot read or change webhooks, releases, or email settings. |

Use person keys when handing an artist (or their AI assistant) access to their own data.

---

## Endpoints

### `GET /v1/submissions`

Fetch demo submissions from your label's database.

**Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 20 | Max results (max: 100) |
| `offset` | number | 0 | Pagination offset |

**Example Request:**
```bash
curl https://dashboard.vektra.games/api/v1/submissions \
  -H "X-API-Key: vk_your_key_here"
```

**Example Response:**
```json
{
  "data": [
    {
      "id": 1,
      "track_title": "Midnight Drive",
      "artist_name": "DJ Nova",
      "genre": "House",
      "status": "In Queue",
      "created_at": "2026-07-20T10:00:00Z"
    }
  ],
  "limit": 20,
  "offset": 0
}
```

---

### `POST /v1/submissions`

Submit a new demo from your website into your label's queue.

**Request Body (JSON):**

| Field | Type | Required | Description |
|---|---|---|---|
| `track_title` | string | ✅ | Track title |
| `artist_name` | string | ✅ | Artist or band name |
| `demo_url` | string | ✅ | Direct link to the demo (SoundCloud, Drive, etc.) |
| `genre` | string | | Genre (e.g. "House", "Trap") |
| `notes` | string | | Extra notes from the artist |
| `email` | string | | Artist's email for status update notifications |

**Example Request:**
```bash
curl -X POST https://dashboard.vektra.games/api/v1/submissions \
  -H "X-API-Key: vk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "track_title": "Midnight Drive",
    "artist_name": "DJ Nova",
    "demo_url": "https://soundcloud.com/djnova/midnight-drive",
    "genre": "House",
    "email": "djnova@example.com"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "submission_id": 42,
  "created_at": "2026-07-20T10:00:00Z"
}
```

> **Tip:** If you include an `email`, the artist will automatically receive email updates when your team approves or rejects their demo. They'll also get a one-time secure reply link.

---

### `DELETE /v1/submissions`

Permanently delete a demo submission by its ticket ID.

**Query Parameter:** `id` (the submission's ticket ID, e.g. `SUB-0001`).

The same value can be sent in the JSON body as `submission_id` or `id` instead.

**Example Request:**
```bash
curl -X DELETE https://dashboard.vektra.games/api/v1/submissions?id=SUB-0001 \
  -H "X-API-Key: vk_your_key_here"
```

**Example Response:**
```json
{
  "success": true,
  "deleted_submission_id": "SUB-0001"
}
```

A person key can only delete its own submissions (matched by email). Deleting a submission that doesn't exist (or isn't yours) returns `404`.

---

### `GET /v1/analytics`

Fetch chart-ready analytics for your label's submissions.

**Example Request:**
```bash
curl https://dashboard.vektra.games/api/v1/analytics \
  -H "X-API-Key: vk_your_key_here"
```

**Example Response:**
```json
{
  "status_breakdown": [
    { "status": "In Queue", "count": "120" },
    { "status": "Approved", "count": "34" },
    { "status": "Rejected", "count": "89" }
  ],
  "rating_breakdown": [
    { "rating": 8, "count": "12" },
    { "rating": 9, "count": "7" }
  ],
  "recent_activity": [
    { "day": "2026-07-19T00:00:00Z", "count": "14" }
  ],
  "top_genres": [
    { "genre": "house", "count": "45" },
    { "genre": "trap", "count": "30" }
  ]
}
```

---

### `GET /v1/tickets`

List support tickets. Optionally filter by `status` (e.g. `open`, `resolved`).

**Example Request:**
```bash
curl "https://dashboard.vektra.games/api/v1/tickets?status=open" \
  -H "X-API-Key: vk_your_key_here"
```

**Example Response:**
```json
{
  "tickets": [
    {
      "id": 7,
      "subject": "Demo link broken",
      "status": "open",
      "created_at": "2026-07-21T14:00:00Z"
    }
  ]
}
```

---

### `POST /v1/tickets`

Open a new support ticket.

**Request Body (JSON):**

| Field | Type | Required | Description |
|---|---|---|---|
| `subject` | string | ✅ | Ticket subject |
| `message` | string | ✅ | The message (also accepts `body`) |
| `name` | string | | Person opening the ticket |

**Example Request:**
```bash
curl -X POST https://dashboard.vektra.games/api/v1/tickets \
  -H "X-API-Key: vk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Demo link broken",
    "message": "The SoundCloud link 404s, here is a new one: ...",
    "name": "DJ Nova"
  }'
```

---

### `DELETE /v1/tickets`

Permanently delete a support ticket by its ID.

**Query Parameter:** `id` (or send `ticket_id` / `id` in the JSON body).

```bash
curl -X DELETE https://dashboard.vektra.games/api/v1/tickets?id=7 \
  -H "X-API-Key: vk_your_key_here"
```

**Example Response:**
```json
{
  "success": true,
  "deleted_ticket_id": "7"
}
```

---

### `GET /v1/releases`

List release packages submitted for Vektra QC. **Workspace keys only.**

```bash
curl https://dashboard.vektra.games/api/v1/releases \
  -H "X-API-Key: vk_your_key_here"
```

---

## Webhooks

Webhook subscriptions let you receive workspace events in real time. **Workspace keys only.**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/webhooks` | List subscriptions and delivery status |
| `POST` | `/v1/webhooks` | Subscribe a URL to events |
| `DELETE` | `/v1/webhooks` | Remove a subscription |

**Supported events:** `submission.created`, `submission.status_changed`

**Example — subscribe:**
```bash
curl -X POST https://dashboard.vektra.games/api/v1/webhooks \
  -H "X-API-Key: vk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/vektra",
    "events": ["submission.created", "submission.status_changed"]
  }'
```

The response includes the webhook `id` and an HMAC signing `secret` — store the secret on your side to verify payloads. If you don't provide a `secret`, Vektra generates one.

**Example — unsubscribe:**
```bash
curl -X DELETE https://dashboard.vektra.games/api/v1/webhooks \
  -H "X-API-Key: vk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_id": "wh_abc123"
  }'
```

---

## Email Settings

Read or update the workspace's artist email configuration. **Workspace keys only.**

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/settings/email` | Read email template, reply address, and Resend status |
| `PUT` | `/v1/settings/email` | Update the custom HTML template and/or reply address |

**Example `GET` response:**
```json
{
  "custom_domain": "demos.yourlabel.com",
  "reply_email": "no-reply@yourlabel.com",
  "resend_key_set": true,
  "email_html": "<!DOCTYPE html>..."
}
```

**Example `PUT` request:**
```bash
curl -X PUT https://dashboard.vektra.games/api/v1/settings/email \
  -H "X-API-Key: vk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "reply_email": "no-reply@yourlabel.com",
    "email_html": "<!DOCTYPE html>..."
  }'
```

`resend_key_set: false` means no Resend API key is configured, so emails cannot be sent. The key itself is set in the Dashboard → Developer tab and can never be read back through the API.

> **See also:** the [Email & artist notifications](/email) guide covers Resend setup, custom sender domains, template placeholders, and reply links. The [MCP & AI assistants](/mcp) page covers using these endpoints through Claude and other AI tools.

---

## Email Notifications

When you approve or reject a submission from the Dashboard and the submission has an `email` field:

1. Vektra first tries to **DM the artist** on Discord (if they are in your server).
2. If they aren't in the server, Vektra sends a **branded email** from your label's sender domain (configured in Dashboard → Developer).
3. The email includes a **one-time secure reply link** — the artist can click it, type a response, and Vektra forwards that reply directly to your staff Discord channel.

---

## Custom Domains

You can serve Vektra's submission portal from your own domain (e.g. `demos.yourlabel.com`).

1. Add a **CNAME record** at your DNS provider:
   - **Name:** `demos` (or whatever subdomain you want)
   - **Value:** `cname.vercel-dns.com`

2. Go to **Dashboard → Developer → Custom Domain** and enter your domain.

3. Vektra will verify the DNS and provision an SSL certificate automatically.

Your free subdomain is also always available at `yourlabelname.vektra.games`.

---

## Rate Limits

| Endpoint | Limit |
|---|---|
| `POST /v1/submissions` | 20 per minute |
| All other endpoints | 60 per minute |

---

## Error Codes

| Status | Meaning |
|---|---|
| `401` | Missing API Key |
| `403` | Invalid or expired API Key, or endpoint not allowed for this key scope |
| `400` | Missing required fields |
| `404` | Resource not found |
| `409` | Conflict (e.g. domain already taken) |
| `503` | Storage unavailable for this workspace |
| `500` | Internal Server Error |
