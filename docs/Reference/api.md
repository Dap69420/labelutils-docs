# Vektra API Documentation

Welcome to the **Vektra Developer API** — the official API for receiving and managing demo submissions through your own website or app.

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

## Email Notifications

When you approve or reject a submission from the Dashboard and the submission has an `email` field:

1. Vektra first tries to **DM the artist** on Discord (if they are in your server).
2. If they aren't in the server, Vektra sends a **branded email** from your label's reply address (configured in Dashboard → Developer → Domains).
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

| Plan | Requests per minute |
|---|---|
| Pro | 60 |
| Pro+ | 300 |

---

## Error Codes

| Status | Meaning |
|---|---|
| `401` | Missing API Key |
| `403` | Invalid or expired API Key |
| `400` | Missing required fields |
| `409` | Conflict (e.g. domain already taken) |
| `503` | Storage unavailable for this workspace |
| `500` | Internal Server Error |
