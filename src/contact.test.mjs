// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { validate, buildRaw } from "./contact.mjs";

const ok = { name: "Zoë", email: "zoe@example.com", message: "Hello" };

test("validate", () => {
  assert.deepEqual(validate(ok).value, ok);
  assert.ok(validate({ ...ok, name: "  " }).error);
  assert.ok(validate({ ...ok, message: null }).error);
  assert.ok(validate({ ...ok, message: "x".repeat(5001) }).error);
  for (const email of ["nope", "a@b", "a b@c.com", "a@c.com\r\nBcc: x@y.com", "<a@c.com>", "a@c.com, b@d.com"]) {
    assert.ok(validate({ ...ok, email }).error, email);
  }
});

test("buildRaw keeps visitor input out of raw headers", () => {
  const raw = buildRaw({ from: "noreply@example.org", to: "me@example.org", ...ok, name: "Evil\r\nBcc: x@y.com" });
  const [headers, body] = raw.split("\r\n\r\n");
  assert.ok(!headers.includes("Bcc"));
  assert.match(headers, /^Reply-To: zoe@example.com$/m);
  assert.match(headers, /^Message-ID: <.+@example.org>$/m);
  const subject = headers.match(/^Subject: =\?utf-8\?B\?(.+)\?=$/m)[1];
  assert.equal(Buffer.from(subject, "base64").toString(), "Contact form: Evil\r\nBcc: x@y.com");
  assert.match(Buffer.from(body.replace(/\r\n/g, ""), "base64").toString(), /Hello$/);
  assert.ok(body.split("\r\n").every((l) => l.length <= 76));
});
