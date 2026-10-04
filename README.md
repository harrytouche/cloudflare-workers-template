# cloudflare-workers-template

Baseline template for a static site deployed on Cloudflare Workers (static assets, no build step). Click **"Use this template"** on GitHub to start a new project from this.

## What's included

- `public/` — the site itself: `index.html`, `style.css`, `main.js`, `_headers`. No build step — Cloudflare serves this directory directly.
- `src/index.js`: Worker for `/api/*`. `/api/contact` handles the [contact form](#contact-form-email-via-cloudflare) (helpers and tests in `src/contact*.mjs`). Placeholder endpoint `/api/placeholder_route` returns JSON with `placeholder_variable`, so you can see prod vs preview values. Plain JS, no build step. `assets.run_worker_first` sends `/api/*` to it; everything else is served from `public/`.
- `wrangler.jsonc` — Workers config.
- `CLAUDE.md` — agent instructions for active development (currently: always surface Cloudflare preview links).

## Prerequisites

- Node.js
- A Cloudflare account
- `wrangler` (installed as a dev dependency — no global install needed)

## Local development

```
npm install
npm run dev
```

## Deploy

```
npm run deploy
```

## One-time Cloudflare setup

1. **Rename the Worker.** Edit `name` in `wrangler.jsonc` (currently the placeholder `my-cloudflare-site`). It becomes part of your `*.workers.dev` URL.
2. **Connect Workers Builds** (optional, for auto-deploy on push): Cloudflare dashboard → Workers & Pages → your Worker → Settings → Build → connect this repo's `main` branch. No build command is needed since there's no build step.
3. Optional: [custom domain](#custom-domain-production-and-previews), [contact form](#contact-form-email-via-cloudflare) and [Cloudflare Access](#cloudflare-access).

## Previews

Non-production branches deploy as [Workers Previews](https://developers.cloudflare.com/workers/previews/) via `npx wrangler preview` (needs Wrangler ≥ 4.135.0).

- **`previews` holds preview-only values:** vars and bindings are *not* inherited from the top level, so every one must be repeated in `previews` with sandbox/test values (see `placeholder_variable`, a demo var you can delete). Never point a preview at production data.
- **Preview names come from the branch name**, sanitised (non-alphanumerics such as `/` become `-`, lowercased) and truncated if long.
- **Dashboard (one-time):** Worker → Settings → Builds → deploy command `npx wrangler deploy`; non-production branch command `npx wrangler preview`; keep "Builds for non-production branches" on.
- **Secrets are separate from production's.** Set them per preview base config: `npx wrangler preview base-config secret put <NAME>` (or dashboard → Worker → Settings → Variables and secrets → **Previews Base** tab). Changes only apply to previews created afterwards.

## Custom domain (production and previews)

Production is served at `<PROD_HOST>` (e.g. `app.example.com`) and each branch preview at `<preview-name>.<PROD_HOST>`. The zone must be on Cloudflare.

1. In `wrangler.jsonc`, uncomment `routes` and replace `<PROD_HOST>`:
   ```jsonc
   "routes": [{ "pattern": "<PROD_HOST>", "custom_domain": true, "previews_enabled": true }]
   ```
   Wrangler creates the DNS record and certificate for you on deploy.
2. Dashboard → Worker → Settings → Domains & Routes → set `<PROD_HOST>` to **Production and Preview**.
3. Set `workers_dev: false` and `preview_urls: false` in `wrangler.jsonc` so only the custom domain serves traffic. `workers.dev` URLs aren't covered by your custom-domain Access apps, so leaving them on would expose previews (and any working form) publicly. Change these in the file, not just the dashboard: every `wrangler deploy` re-applies them.
4. Merge and deploy to production. Preview hostnames only start working after that.
5. Verify with a throwaway PR: the Workers Builds check should show `https://<branch>.<PROD_HOST>`.

Caveats: Cloudflare creates a wildcard `*.<PROD_HOST>` record and certificate, so use a dedicated host (e.g. `app.example.com`, not the apex) if `<PROD_HOST>` already has subdomains. Hostnames deeper than one level below the zone may need Advanced Certificate Manager / Total TLS. Custom-domain previews do **not** get `X-Robots-Tag: noindex` automatically, unlike `workers.dev` ones. Protect them with [Cloudflare Access](#cloudflare-access).

## Contact form (email via Cloudflare)

`public/index.html` has a contact form that POSTs to `/api/contact` (`src/index.js`). The Worker validates the input (`src/contact.mjs`), verifies a [Turnstile](https://developers.cloudflare.com/turnstile/) token, and sends a plain-text email through the [`send_email` binding](https://developers.cloudflare.com/email-routing/email-workers/send-email-workers/). `Reply-To` is the visitor's address, so you can reply straight from your inbox. The destination address only exists as a secret, never in the page or the repo. Run `npm test` for the validation and header-injection tests.

Responses: 200 sent, 400 validation, 403 Turnstile failed, 502 send failed. Previews set `SHOW_SEND_ERRORS` (in `previews.vars`), which appends the underlying `send_email` error to a 502 so setup problems show in the form. Production never shows it.

**One-time setup (dashboard, not in git):**

1. **Email Routing:** your domain → **Email** → **Email Routing** → enable it, then under **Destination addresses** add and verify the inbox that should receive messages. `send_email` only delivers to verified destinations.
2. **Turnstile:** **Turnstile** → **Add widget** → add `<PROD_HOST>` (and your preview host pattern if Turnstile fails on previews), mode **Managed**. Put the **site key** in `data-sitekey` in `public/index.html`. It's public by design. The default `1x00000000000000000000AA` is Cloudflare's always-pass test key and will fail verification against a real secret.
3. **Worker secrets:** Worker → Settings → Variables and secrets, type **Secret** (plain-text dashboard vars get wiped by `wrangler deploy`):
   - `CONTACT_TO`: the verified inbox from step 1
   - `CONTACT_FROM`: any address on your Email Routing domain (e.g. `noreply@example.com`). No mailbox is needed.
   - `TURNSTILE_SECRET`: the widget's secret key
4. **Preview secrets:** repeat step 3 for previews: `npx wrangler preview base-config secret put CONTACT_TO` (likewise `CONTACT_FROM`, `TURNSTILE_SECRET`). Previews then send real mail, so keep them behind Access.
5. Submit the form once on production to confirm delivery. Failures are logged with `console.error` and kept in the Worker's **Logs** tab (`observability.enabled`).

**Local:** create a gitignored `.dev.vars` with the always-pass test secret, then `npm run dev`. `wrangler dev` doesn't send real mail; it writes each message to a `.eml` under `.wrangler/tmp/` and logs the path.

```
CONTACT_TO="you@example.com"
CONTACT_FROM="noreply@example.com"
TURNSTILE_SECRET="1x0000000000000000000000000000000AA"
```

Not using the form? Delete it from `public/index.html` and `public/main.js`, the `/api/contact` route and `src/contact*.mjs`, and the `send_email` bindings.

## Cloudflare Access

Use [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/) to keep previews private while production stays public (or private too). Everything is in the dashboard under **Zero Trust** (first visit sets up a team name and the free plan).

1. **Login method:** Zero Trust → Integrations → Identity providers. The default **One-time PIN** (emailed code) is enough; add GitHub/Google if you prefer.
2. **Previews application:** Zero Trust → Access controls → Applications → **Create new application** → **Self-hosted**.
   - Name: `<site> previews`; destination hostname: `*.<PROD_HOST>` (wildcard subdomain). The wildcard covers both preview URLs and deployment URLs.
   - Policy: **Allow**, include **Emails** = your address (or an email domain / group for a team). Everyone else is denied: Access applications are deny-by-default.
3. **Production application:** a second self-hosted application for `<PROD_HOST>`:
   - **Public site:** policy action **Bypass**, include **Everyone**. Requests skip Access entirely, but the hostname now has an explicit application, which the deny-all setting in step 4 requires.
   - **Private site:** policy action **Allow** with the same rule as previews.
4. **Deny all by default (recommended):** Zero Trust → Access controls → **Access settings** → turn on **Block traffic to all domains in this account** ([docs](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/require-access-protection/)). Any hostname without an Access application is then blocked with Error 1050, so a new Worker, preview host or DNS record can't go live publicly by accident. **Before turning it on**, make sure every hostname that should stay reachable (including other sites in the account) has an application with an Allow or Bypass policy, or is listed under **Hostnames to Exempt**. Keep exemptions to genuinely public content.
5. **Verify:** in a private window, a preview URL should show the Access login page and `<PROD_HOST>` should load (or prompt, if private). A hostname you never added should show Error 1050.

`workers.dev` URLs aren't on your zone, so neither the applications above nor the deny-all setting covers them. Turn them off (see [Custom domain](#custom-domain-production-and-previews), step 3), or use Worker → Settings → Domains & Routes → **Enable Cloudflare Access** on them.

## License

MIT — see `LICENSE`.
