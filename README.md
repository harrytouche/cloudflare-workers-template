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

## License

MIT — see `LICENSE`.
