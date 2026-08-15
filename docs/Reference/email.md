---
title: "Email & Artist Notifications"
description: "How Vektra emails artists: Resend setup, custom sender domains, templates, and one-time reply links"
sidebarTitle: "Email & Notifications"
---

Vektra can email artists status updates on their demos, with branded templates and secure one-time reply links. Everything is configured from the **Dashboard → Developer** tab.

## How mailing works

Artist emails are sent through **Resend**. Each workspace stores its own Resend API key, sender domain, reply address, and optional custom HTML template.

When a submission's status changes (Approved / Rejected / In Queue):

1. Vektra first tries to **DM the artist on Discord** if they're in your server.
2. If they aren't in the server, Vektra sends a **branded email** with the new status, the submission ID, track title, and any message from your A&R team.
3. Every status email includes a **one-time reply link** — the artist clicks it, writes back, and Vektra forwards the reply to your staff Discord thread.

## Setting it up

1. Open **Dashboard → Developer**.
2. Add a **Resend API key** in the "Sender Email & Resend API" section.
3. Add a **custom sender domain** (e.g. `demos.yourlabel.com`) and verify it with Resend — emails are sent from `"Your Label" <demos@yourlabel.com>`.
4. Set a **reply-to address** if you want replies to go somewhere specific.

Without a Resend key, emails cannot be sent — the Developer tab (and `GET /v1/settings/email`) reports `resend_key_set: false`.

## Custom sender domain

Use your own domain so emails come from your label, not a Vektra address:

1. Add a **CNAME record** at your DNS provider pointing to Vektra.
2. Enter the domain in **Dashboard → Developer → Custom Domain**.
3. Verify the DNS records with Resend from the same screen.

Once verified, emails are sent from `demos@yourdomain.com`. A default `yourlabel.vektra.games` address is always available if you don't set a custom domain.

## Custom email templates

You can supply your own HTML template — write it in the **Developer → Email Template** editor, or let an AI assistant do it through the [MCP connector](/mcp) (`update_email_template`). When a template is set, every artist email is rendered from it; when it's empty, Vektra's built-in template is used.

**Allowed placeholders:**

| Placeholder | Replaced with |
|---|---|
| `{label_name}` | Your label's name |
| `{subject}` | The email subject |
| `{artist_name}` | The artist's name |
| `{headline}` | A short headline line |
| `{accent_color}` | The status color (green / red / amber) |
| `{status}` | The new submission status |
| `{submission_id}` | The submission ticket ID |
| `{track_title}` | The track title |
| `{message}` | The A&R team's message text |
| `{reply_url}` | The one-time reply link URL |
| `{reply_button}` | The reply button **label** |
| `{year}` | The current year |

Rules to follow:

- `{reply_button}` is only the button text — wrap it yourself: `<a href="{reply_url}">{reply_button}</a>`.
- Keep the template fully self-contained with **inline CSS on every element** — email clients strip `<style>` blocks.
- Don't invent placeholders beyond the ones listed.

## Reply links

- Every status email includes a reply link valid for **72 hours**, single use.
- Clicking it opens a reply page where the artist writes back.
- The reply is stored and your **staff Discord thread is notified** so your team can follow up.

## Troubleshooting

| Symptom | Cause |
|---|---|
| Emails not sending, `resend_key_set: false` | No Resend API key configured in Developer tab (or env not loaded on the deployed server — redeploy after changing env). |
| "Could not reach the artist" | The submission has no email stored (e.g. submitted via Discord without a contact email). |
| Emails show Vektra's default sender | Custom sender domain not added or DNS not verified yet. |
| Template changes not visible | Make sure you save in the Developer tab (or via the API) and redeploy isn't needed — the template is stored per-workspace in the database. |
| Artist never got the email | They may be in your Discord server (then Vektra DMs instead of emailing), or their email was missing at submission time. |

## See also

- [Developer API](/api) — `GET`/`PUT /v1/settings/email` and the email notification flow.
- [MCP & AI Assistants](/mcp) — have an AI assistant read or edit your email template.
