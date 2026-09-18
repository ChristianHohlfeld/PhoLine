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

check("isChatUrl matches ChatGPT, Grok WS, Gemini, REST", () => {
  assert.equal(Pho.isChatUrl("https://chatgpt.com/backend-api/conversation"), true);
  assert.equal(Pho.isChatUrl("https://chatgpt.com/backend-api/f/conversation"), true);
  assert.equal(Pho.isChatUrl("wss://grok.com/ws/mgw/"), true);
  assert.equal(Pho.isChatUrl("https://grok.com/rest/app-chat/conversations/new"), true);
  assert.equal(Pho.isChatUrl("https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate"), true);
  assert.equal(Pho.isChatUrl("https://api.x.ai/v1/chat/completions"), true);
  assert.equal(Pho.isChatUrl("https://example.com/blog"), false);
  assert.equal(Pho.isChatUrl("https://chatgpt.com/cdn-cgi/challenge.js"), false);
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

check("ChatGPT author.role + content.parts is rewritten", () => {
  const input = {
    action: "next",
    messages: [
      {
        id: "11111111-1111-4111-8111-111111111111",
        author: { role: "user" },
        content: {
          content_type: "text",
          parts: ["Erkläre warum IPA auf dem Tokenizer teurer ist als ein Kanalalphabet."],
        },
      },
    ],
  };
  const out = Pho.rewriteRequestBody(JSON.stringify(input), "https://chatgpt.com/backend-api/f/conversation", {
    primed: true,
    injectProtocol: false,
  });
  assert.equal(out.changed, true);
  const parsed = JSON.parse(out.body);
  assert.match(parsed.messages[0].content.parts[0], /^¶ /);
  assert.equal(parsed.messages[0].author.role, "user");
});

check("Grok REST message field is rewritten", () => {
  const input = {
    temporary: true,
    modelName: "grok-4",
    message: "Erkläre Kompression von Sprache bevor der Tokenizer zuschlägt.",
  };
  const out = Pho.rewriteRequestBody(JSON.stringify(input), "https://grok.com/rest/app-chat/conversations/new", {
    primed: true,
    injectProtocol: false,
  });
  assert.equal(out.changed, true);
  const parsed = JSON.parse(out.body);
  assert.match(parsed.message, /^¶ /);
});

check("Grok mgw conversation.item.create input_chunks is rewritten", () => {
  const input = {
    session_id: "sess_1",
    event: {
      type: "conversation.item.create",
      event_id: "evt_msg_1",
      item: {
        type: "message",
        role: "user",
        x_grok: {
          client_message_id: "11111111-1111-4111-8111-111111111111",
          input_chunks: [{ text: { text: "Warum darf man IPA nicht auf den Tokenizer legen?" } }],
        },
      },
    },
  };
  const url = "wss://grok.com/ws/mgw/";
  assert.equal(Pho.isChatUrl(url), true);
  const out = Pho.rewriteRequestBody(JSON.stringify(input), url, { primed: true, injectProtocol: false });
  assert.equal(out.changed, true, "grok input_chunks must change");
  const parsed = JSON.parse(out.body);
  const text = parsed.event.item.x_grok.input_chunks[0].text.text;
  assert.match(text, /^¶ /);
});

check("Gemini f.req nested JSON array is rewritten", () => {
  const prompt = "Erkläre Kompression von Sprache in drei kurzen Sätzen bitte";
  const inner = JSON.stringify([[prompt, "en"], null]);
  const body = new URLSearchParams({ "f.req": JSON.stringify([null, inner]), at: "token" }).toString();
  const url = "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate";
  const out = Pho.rewriteRequestBody(body, url, { primed: true, injectProtocol: false });
  assert.equal(out.changed, true, "gemini f.req must change");
  assert.ok(out.body.includes("¶") || out.rewrites.some((r) => r.to.includes("¶")));
  assert.ok(!out.body.includes(prompt) || out.rewrites.length >= 1);
});

check("question mark stays on the wire, not turned into a period", () => {
  const { wire } = Pho.encode("Warum darf man IPA nicht auf den Tokenizer legen?");
  assert.match(wire, /\?/);
  assert.ok(wire.trimEnd().endsWith("?"), "encoded question must end with ?");
  const { wire: stmt } = Pho.encode("Das ist eine Aussage.");
  assert.match(stmt, /\./);
  assert.doesNotMatch(stmt, /\?/);
});

check("semantic operators survive compression", () => {
  const de = Pho.encode("Ändere nicht die Datenbank, sondern nur die API. Wenn A und B gelten, nutze A oder B.").wire;
  assert.match(de, /\\bnot\\b/, "German negation must survive");
  assert.match(de, /\\bonly\\b/, "German exclusivity must survive");
  assert.match(de, /\\bif\\b/, "German condition must survive");
  assert.match(de, /\\band\\b/, "German conjunction must survive");
  assert.match(de, /\\bor\\b/, "German alternative must survive");

  const en = Pho.encode("Do not modify A or B, but only inspect C if D is true.").wire;
  assert.match(en, /\\bnot\\b/, "English negation must survive");
  assert.match(en, /\\bor\\b/, "English alternative must survive");
  assert.match(en, /\\bbut\\b/, "English contrast must survive");
  assert.match(en, /\\bonly\\b/, "English exclusivity must survive");
  assert.match(en, /\\bif\\b/, "English condition must survive");
});

check("looksLikeChatPayload detects grok and chatgpt envelopes", () => {
  assert.equal(Pho.looksLikeChatPayload('{"event":{"type":"conversation.item.create","item":{"x_grok":{"input_chunks":[]}}}}'), true);
  assert.equal(Pho.looksLikeChatPayload('{"author":{"role":"user"},"content":{"parts":["hi there friend"]}}'), true);
  assert.equal(Pho.looksLikeChatPayload('{"foo":1}'), false);
});

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nall tests passed");
