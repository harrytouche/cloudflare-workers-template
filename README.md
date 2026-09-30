# cloudflare-workers-template

Baseline template for a static site deployed on Cloudflare Workers (static assets, no build step). Click **"Use this template"** on GitHub to start a new project from this.

## What's included

- `public/` — the site itself: `index.html`, `style.css`, `main.js`, `_headers`. No build step — Cloudflare serves this directory directly.
- `wrangler.jsonc` — Workers static-assets config.
- `.claude/skills/grill-me/` and `.claude/skills/grilling/` — interview-driven requirements stress-testing before you build (`grill-me` is a thin alias that invokes `grilling`). Third-party skills from [mattpocock/skills](https://github.com/mattpocock/skills), MIT licensed — see the `NOTICE` in each directory.
- `.claude/skills/ponytail/` — enforces the simplest working solution (YAGNI ladder) on coding tasks. Third-party skill from [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail), MIT licensed — see `.claude/skills/ponytail/NOTICE`.
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

1. **Rename the Worker.** Edit `name` in `wrangler.jsonc` (currently the placeholder `my-cloudflare-site`) — this becomes part of your `*.workers.dev` URL.
2. **Connect Workers Builds** (optional, for auto-deploy on push): Cloudflare dashboard → Workers & Pages → your Worker → Settings → Build → connect this repo's `main` branch. No build command is needed since there's no build step.
3. **Custom domain** (optional): Workers & Pages → your Worker → Settings → Domains & Routes → add your domain. Once a custom domain is attached, consider setting `workers_dev: false` in `wrangler.jsonc` so only the custom domain serves production traffic — until then, `workers_dev: true` is what gives you a working `*.workers.dev` URL out of the box.
4. `preview_urls: true` keeps per-branch `*.workers.dev` preview links working for PRs regardless of the `workers_dev` setting above.

## Previews

Non-production branches deploy as [Workers Previews](https://developers.cloudflare.com/workers/previews/) via `npx wrangler preview` (needs Wrangler ≥ 4.135.0).

- **`previews: {}` is empty on purpose:** this is a static-assets-only Worker with no vars, secrets or bindings, so there's nothing to isolate from production. If you add any, give `previews` its own sandbox/test values — vars and bindings are *not* inherited.
- **Preview names come from the branch name**, sanitised (non-alphanumerics such as `/` become `-`, lowercased) and truncated if long.
- **Dashboard (one-time):** Worker → Settings → Builds → deploy command `npx wrangler deploy`; non-production branch command `npx wrangler preview`; keep "Builds for non-production branches" on.
- **Previews on a custom domain** (optional, once production has one): add to `wrangler.jsonc`
  ```jsonc
  "routes": [{ "pattern": "<PROD_HOST>", "custom_domain": true, "previews_enabled": true }]
  ```
  then Worker → Domains → set `<PROD_HOST>` to "Production and Preview". Previews are then served at `<preview-name>.<PROD_HOST>` (only after that config is merged and deployed to production). Caveats: Cloudflare creates a wildcard `*.<PROD_HOST>` record and certificate, so use a dedicated host (e.g. `previews.example.com`) if `<PROD_HOST>` already has subdomains; deeper hostnames may need Advanced Certificate Manager / Total TLS; custom-domain previews do **not** get `X-Robots-Tag: noindex` automatically, unlike `workers.dev` ones.

## License

MIT — see `LICENSE`.
