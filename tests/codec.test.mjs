/**
 * PhoLine codec tests.
 * Copyright © 2026 Christian Heinrich Hohlfeld
 * ORCID: https://orcid.org/0009-0003-6634-9045
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const code = readFileSync(join(root, "extension/pho.js"), "utf8");
eval(code);
const Pho = globalThis.PhoLine;
assert.ok(Pho, "globalThis.PhoLine must exist after loading extension/pho.js");

let failed = 0;
function check(name, fn) {
  try {
    fn();
    console.log("ok  ", name);
  } catch (err) {
    failed += 1;
    console.error("FAIL", name);
    console.error("    ", err.message);
  }
}

check("wire mark is pilcrow", () => {
  assert.equal(Pho.WIRE_MARK, "¶");
});

check("German news sentence maps to channel stems, not IPA", () => {
  const { wire, dropped } = Pho.encode(
    "Heute Morgen hat der Bundestag den Entwurf zur Datenspeicherung beschlossen. Kritiker warnen vor einem Eingriff in die Privatsphäre.",
  );
  assert.match(wire, /^¶ /);
  assert.match(wire, /\bbund\b/);
  assert.match(wire, /\bdraft\b/);
  assert.match(wire, /\bprivacy\b/);
  assert.doesNotMatch(wire, /ʃ|ə|ˈ|datenspɛ/);
  assert.ok(dropped.includes("der") || dropped.includes("hat") || dropped.includes("den"));
});

check("IPA is not the payload: naive-looking phones stay off the wire", () => {
  const { wire } = Pho.encode("Schule sprechen wichtig");
  assert.doesNotMatch(wire, /ʃuːlə|ʃpreçən/);
});

check("U side-channel keeps URLs exact", () => {
  const url = "https://christianhohlfeld.com/paper.pdf";
  const { wire, u } = Pho.encode(`Siehe ${url} bitte.`);
  assert.ok(u.includes(url));
  assert.ok(wire.includes(url));
});

check("decode expands English stems back toward German", () => {
  const de = Pho.decode("¶ bund draft privacy pack", "de");
  assert.match(de.toLowerCase(), /bundestag|entwurf|privatsphäre|kompression/);
});

check("isPhoLine detects marked replies only", () => {
  assert.equal(Pho.isPhoLine("¶ arch pack lang"), true);
  assert.equal(Pho.isPhoLine("ordinary German answer"), false);
});

check("isChatUrl matches known hosts", () => {
  assert.equal(Pho.isChatUrl("https://chatgpt.com/backend-api/conversation"), true);
  assert.equal(Pho.isChatUrl("https://api.x.ai/v1/chat/completions"), true);
  assert.equal(Pho.isChatUrl("https://example.com/blog"), false);
});

check("rewriteChatPayload rewrites user content and injects protocol once", () => {
  const input = {
    messages: [{ role: "user", content: "Warum darf man IPA nicht auf den Tokenizer legen?" }],
  };
  const out = Pho.rewriteChatPayload(input, { primed: false, injectProtocol: true });
  assert.equal(out.primed, true);
  assert.ok(out.rewrites.length >= 1);
  const payload = out.payload;
  const sys = payload.messages.find((m) => m.role === "system");
  const user = payload.messages.find((m) => m.role === "user");
  assert.ok(sys, "protocol must be injected as a system message");
  assert.match(sys.content, /PhoLine v2/);
  assert.match(user.content, /^¶ /);
  assert.doesNotMatch(user.content, /PhoLine v2/);
});

check("system and assistant messages are not rewritten", () => {
  const input = {
    messages: [
      { role: "system", content: "You are a helpful assistant in German." },
      { role: "assistant", content: "Guten Tag, wie kann ich helfen?" },
      { role: "user", content: "Erkläre Kompression von Sprache in drei Sätzen." },
    ],
  };
  const out = Pho.rewriteChatPayload(input, { primed: true, injectProtocol: false });
  assert.equal(out.payload.messages[0].content, input.messages[0].content);
  assert.equal(out.payload.messages[1].content, input.messages[1].content);
  assert.match(out.payload.messages[2].content, /^¶ /);
});

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall tests passed");
