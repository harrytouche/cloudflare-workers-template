// /api/* is routed here first (assets.run_worker_first); other paths only arrive when no static asset matches.
// Contact form secrets (dashboard or `wrangler secret put`, never in git): CONTACT_TO,
// CONTACT_FROM, TURNSTILE_SECRET. See README → Contact form.
import { EmailMessage } from "cloudflare:email";
import { validate, buildRaw } from "./contact.mjs";

const json = (status, body) => Response.json(body, { status });

async function verifyTurnstile(token, ip, secret) {
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip || "" }),
    });
    return (await res.json()).success === true;
  } catch (e) {
    console.error("Turnstile verify failed", e);
    return false;
  }
}

async function contact(request, env) {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." });

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { error: "Invalid submission." });
  }

  const { value, error } = validate({ name: form.get("name"), email: form.get("email"), message: form.get("message") });
  if (error) return json(400, { error });

  const human = await verifyTurnstile(form.get("cf-turnstile-response"), request.headers.get("CF-Connecting-IP"), env.TURNSTILE_SECRET);
  if (!human) return json(403, { error: "Verification failed — please try again." });

  try {
    const raw = buildRaw({ from: env.CONTACT_FROM, to: env.CONTACT_TO, ...value });
    await env.SEND_EMAIL.send(new EmailMessage(env.CONTACT_FROM, env.CONTACT_TO, raw));
  } catch (e) {
    console.error("send_email failed", e);
    // Previews set SHOW_SEND_ERRORS (wrangler.jsonc → previews.vars) to surface
    // the underlying reason while debugging setup; production never shows it.
    const detail = env.SHOW_SEND_ERRORS ? ` (${e.message})` : "";
    return json(502, { error: `Sorry, your message couldn't be sent. Please try again later.${detail}` });
  }
  return json(200, { ok: true });
}

export default {
  fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/contact") return contact(request, env);
    if (pathname === "/api/placeholder_route") {
      return Response.json({ placeholder_variable: env.placeholder_variable });
    }
    return new Response("Not found", { status: 404 });
  },
};
