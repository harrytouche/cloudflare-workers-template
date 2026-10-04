// Pure helpers for the contact form Worker — no Workers-only imports, so
// contact.test.mjs can run them under plain Node.

// Deliberately strict: no whitespace, quotes, brackets or commas, so the
// address is safe to drop straight into a Reply-To header (no CRLF injection).
const EMAIL_RE = /^[^\s@<>"',;:\\()[\]]+@[^\s@<>"',;:\\()[\]]+\.[^\s@<>"',;:\\()[\]]+$/;

export const LIMITS = { name: 100, email: 254, message: 5000 };

export function validate(fields) {
  const str = (v) => (typeof v === "string" ? v.trim() : "");
  const name = str(fields.name);
  const email = str(fields.email);
  const message = str(fields.message);
  if (!name || !email || !message) return { error: "Please fill in your name, email and message." };
  if (name.length > LIMITS.name) return { error: "Name is too long." };
  if (email.length > LIMITS.email || !EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };
  if (message.length > LIMITS.message) return { error: `Message must be under ${LIMITS.message} characters.` };
  return { value: { name, email, message } };
}

function base64(str) {
  let bin = "";
  for (const byte of new TextEncoder().encode(str)) bin += String.fromCharCode(byte);
  return btoa(bin);
}

// Minimal single-part text/plain RFC 5322 message. Visitor-supplied text only
// ever lands base64-encoded (subject, body) or pre-validated (Reply-To).
// ponytail: subject is one encoded-word, may exceed RFC 2047's 75-char limit
// for long names — mail clients tolerate it; split into several words if not.
export function buildRaw({ from, to, name, email, message }) {
  const body = base64(`From: ${name} <${email}>\n\n${message}`).replace(/.{76}/g, "$&\r\n");
  return [
    `From: Contact form <${from}>`,
    `To: <${to}>`,
    `Reply-To: ${email}`,
    `Subject: =?utf-8?B?${base64(`Contact form: ${name}`)}?=`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${from.split("@")[1]}>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    body,
  ].join("\r\n");
}
