# Agent instructions

## Session behaviour

- **On every Cloudflare deployment event:** extract the Preview/deployment URL from the bot comment or check run and share it with the user as a clickable hyperlink.
- **Whenever a pull request exists (newly opened, or already open when picking up work on it):** find its branch preview URL (from the Cloudflare Workers Builds check run on the PR: the `*.workers.dev` link, or `<branch>.<PROD_HOST>` once a custom domain is set up) and share it with the user as a clickable hyperlink, so they can view the PR's changes live before merging.
