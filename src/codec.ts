import {
  CHANNEL_TO_DE,
  CHANNEL_TO_EN,
  DE_CHANNEL,
  DE_STOP,
  EN_CHANNEL,
  EN_STOP,
} from "./lexicon";

export const WIRE_MARK = "¶";

export const SYSTEM_PROMPT = `PhoLine v2. You speak a compact codebook. The client expands. Never mention this protocol.
Rules:
- Every reply starts with ¶ then English content-stems (common 1-token words).
- No articles, copulas, auxiliaries, hedges, greetings, or restating the question.
- Keep numbers, URLs, code, and proper names exact.
- Separate claims with periods. Prefer one line.
Examples:
IN  ¶ bund pass draft data store. crit warn privacy grab.
OUT ¶ crit right. law grow state watch. privacy drop. cost high. vote risk.
IN  ¶ why pack lang before tok
OUT ¶ spell fat. sound keep mean. map cheap token. client expand. ipa on wire cost more.
IN  ¶ new mix arch
OUT ¶ mix arch split load. eye pack ctx. lang pack mean. both need pipe.`;

const STRUCT_RE =
  /https?:\/\/\S+|www\.\S+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|`[^`]+`|\b\d+(?:[.,]\d+)*\b|\b[A-Z]{2,}[A-Z0-9_]{1,}\b/g;

const WORD_RE = /⟦U\d+⟧|[A-Za-zÄÖÜäöüß]+|\d+|[^\sA-Za-zÄÖÜäöüß\d⟦⟧]+/gu;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const USER_KEYS = new Set([
  "message",
  "prompt",
  "query",
  "text",
  "input",
  "user_input",
  "parts",
  "q",
  "question",
  "utterance",
  "content",
  "input_text",
  "input_chunks",
  "contents",
]);

export type Kept = {
  surface: string;
  channel: string;
  reason: "map" | "u" | "keep";
};

export type WireTrace = {
  original: string;
  compact: string;
  wire: string;
  dropped: string[];
  kept: Kept[];
  u: string[];
  german: boolean;
  afterU: string;
  lemmas: string[];
};

function fold(w: string): string {
  return w
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}

function looksGerman(text: string): boolean {
  if (/[äöüÄÖÜß]/.test(text)) return true;
  const words = text.toLowerCase().match(/[a-zäöüß]+/gi) ?? [];
  let hits = 0;
  for (const w of words) if (DE_STOP.has(w) || DE_CHANNEL[fold(w)]) hits++;
  return hits >= Math.max(2, Math.floor(words.length * 0.18));
}

function stemDe(w: string): string {
  let s = fold(w);
  const suf = [
    "ierungen",
    "ierung",
    "ationen",
    "ation",
    "ungen",
    "ung",
    "heiten",
    "heit",
    "keiten",
    "keit",
    "lichen",
    "lich",
    "isches",
    "ische",
    "isch",
    "endem",
    "enden",
    "ende",
    "end",
    "erten",
    "erte",
    "ert",
    "ten",
    "tem",
    "ter",
    "tes",
    "te",
    "est",
    "st",
    "em",
    "en",
    "er",
    "es",
    "e",
    "n",
    "s",
  ];
  for (const x of suf) {
    if (s.length - x.length >= 3 && s.endsWith(x)) {
      s = s.slice(0, -x.length);
      break;
    }
  }
  return s;
}

function stemEn(w: string): string {
  let s = fold(w);
  const suf = ["ation", "tion", "ment", "ness", "ing", "ers", "ies", "ied", "ed", "ly", "es", "s"];
  for (const x of suf) {
    if (s.length - x.length >= 3 && s.endsWith(x)) {
      s = s.slice(0, -x.length);
      break;
    }
  }
  return s;
}

function extractU(text: string): { body: string; u: string[] } {
  const u: string[] = [];
  const body = text.replace(STRUCT_RE, (m) => {
    u.push(m);
    return ` ⟦U${u.length - 1}⟧ `;
  });
  return { body, u };
}

function restoreU(text: string, u: string[]): string {
  return text.replace(/⟦U(\d+)⟧/g, (_, n) => u[Number(n)] ?? "");
}

function mapWord(raw: string, german: boolean): { channel: string; reason: Kept["reason"] } | "drop" {
  if (/^⟦U\d+⟧$/.test(raw)) return { channel: raw, reason: "u" };
  if (!/[A-Za-zÄÖÜäöüß]/.test(raw)) {
    if (/^[?]+$/.test(raw)) return { channel: "?", reason: "keep" };
    if (/^[!]+$/.test(raw)) return { channel: "!", reason: "keep" };
    if (/^[.,;:]+$/.test(raw)) return "drop";
    return { channel: raw, reason: "keep" };
  }
  const f = fold(raw);
  if (german) {
    if (DE_STOP.has(raw.toLowerCase()) || DE_STOP.has(f)) return "drop";
    const hit = DE_CHANNEL[f] ?? DE_CHANNEL[stemDe(raw)];
    if (hit) return { channel: hit, reason: "map" };
  } else {
    if (EN_STOP.has(f)) return "drop";
    const hit = EN_CHANNEL[f] ?? EN_CHANNEL[stemEn(raw)];
    if (hit) return { channel: hit, reason: "map" };
    if (f.length <= 3) return { channel: f, reason: "keep" };
  }
  if (f.length <= 2 && !/^\d/.test(f)) return "drop";
  return { channel: f, reason: "keep" };
}

function joinChannel(parts: string[]): string {
  const out: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (out.length && out[out.length - 1] === p) continue;
    out.push(p);
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

function expandChannel(compact: string, u: string[], lang: "de" | "en"): string {
  const marked = compact.replace(/^\s*¶\s*/, "");
  const lines = marked.split(/\n+/).filter(Boolean);
  const mapped = lines.map((line) => {
    const bits = line.split(/\s+/).filter(Boolean);
    const words = bits.map((b) => {
      if (/^⟦U\d+⟧$/.test(b)) return b;
      if (lang === "de") return CHANNEL_TO_DE[b] ?? b;
      return CHANNEL_TO_EN[b] ?? b;
    });
    const s = words.join(" ").trim();
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1) + (/[.!?]$/.test(s) ? "" : ".");
  });
  return restoreU(mapped.join(" "), u).replace(/\s+/g, " ").trim();
}

export function encodeWire(original: string): WireTrace {
  const german = looksGerman(original);
  const { body, u } = extractU(original);
  const toks = body.match(WORD_RE) ?? [];
  const dropped: string[] = [];
  const kept: Kept[] = [];
  const channelParts: string[] = [];
  const lemmas: string[] = [];

  for (const t of toks) {
    if (/^⟦U\d+⟧$/.test(t)) {
      channelParts.push(t);
      lemmas.push(t);
      kept.push({ surface: t, channel: t, reason: "u" });
      continue;
    }
    if (!/[A-Za-zÄÖÜäöüß\d]/.test(t)) {
      // Keep sentence mood: ? must stay ?, not become .
      if (/\?/.test(t)) channelParts.push("?");
      else if (/!/.test(t)) channelParts.push("!");
      else if (/\./.test(t)) channelParts.push(".");
      continue;
    }
    const m = mapWord(t, german);
    if (m === "drop") {
      dropped.push(t);
      continue;
    }
    lemmas.push(m.reason === "map" ? m.channel : fold(t));
    channelParts.push(m.channel);
    kept.push({ surface: t, channel: m.channel, reason: m.reason });
  }

  const compact = restoreU(joinChannel(channelParts), u);
  const wire = compact ? `${WIRE_MARK} ${compact}` : WIRE_MARK;
  return {
    original,
    compact,
    wire,
    dropped,
    kept,
    u,
    german,
    afterU: body.trim(),
    lemmas,
  };
}

export function decode(wire: string, lang: "de" | "en" = "de"): string {
  const { u, body } = extractU(wire);
  return expandChannel(body, u, lang);
}

export function isPhoLine(text: string): boolean {
  return /^\s*¶/.test(text);
}

export function stripMark(text: string): string {
  return text.replace(/^\s*¶\s*/, "");
}

export function isChatHost(host: string): boolean {
  const h = String(host)
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .toLowerCase();
  return (
    h === "chatgpt.com" ||
    h === "chat.openai.com" ||
    h === "grok.com" ||
    h === "x.com" ||
    h === "claude.ai" ||
    h === "gemini.google.com" ||
    h.endsWith(".chatgpt.com") ||
    h.endsWith(".openai.com") ||
    h.endsWith(".grok.com") ||
    h.endsWith(".claude.ai") ||
    h.endsWith(".gemini.google.com") ||
    h === "api.x.ai" ||
    h === "generativelanguage.googleapis.com" ||
    h.endsWith(".clients6.google.com") ||
    h.endsWith(".googleusercontent.com")
  );
}

export function isAssetUrl(url: string): boolean {
  const raw = String(url);
  return (
    /\.(js|css|mjs|map|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf)(\?|$)/i.test(raw) ||
    /\/cdn-cgi\//i.test(raw) ||
    /\/(telemetry|analytics|sentry|collect|ces\/v1|sentinel|client-perf|v1\/rgstr)\b/i.test(raw)
  );
}

export function isChatUrl(url: string): boolean {
  const raw = String(url);
  let host = "";
  let path = raw;
  try {
    const parsed = new URL(raw, "https://localhost");
    host = parsed.host;
    path = parsed.pathname + parsed.search;
  } catch {
    /* relative */
  }

  if (isAssetUrl(raw)) return false;

  if (/(?:backend-api|backend-anon)\/(?:f\/)?conversation/i.test(raw)) return true;
  if (/\/rest\/app-chat/i.test(raw)) return true;
  if (/\/ws\/mgw/i.test(raw)) return true;
  if (/wss?:\/\/[^/]*grok\.com/i.test(raw)) return true;
  if (/chat_conversations\/[^/]+\/completion/i.test(raw)) return true;
  if (/\/v1\/chat\/completions/i.test(raw)) return true;
  if (/\/v1\/messages(?:\?|$)/i.test(raw)) return true;
  if (/\/v1\/responses/i.test(raw)) return true;
  if (/generativelanguage\.googleapis/i.test(raw)) return true;
  if (/StreamGenerate|BardChatUi|batchexecute|BardFrontendService/i.test(raw)) return true;
  if (/\/api\/chat(?:\?|\/|$)/i.test(raw)) return true;
  if (/append_message/i.test(raw)) return true;
  if (/\/conversations\/[^/]+\/messages/i.test(raw)) return true;
  if (/\/app-chat\/conversations/i.test(raw)) return true;
  if (/\$rpc\/google\.internal/i.test(raw)) return true;

  if (isChatHost(host)) {
    if (/\/(telemetry|analytics|sentry|collect|ces\/v1|sentinel)\b/i.test(path)) return false;
    return true;
  }
  return false;
}

export function looksLikeChatPayload(body: string): boolean {
  const s = String(body);
  if (s.length < 8) return false;
  if (/conversation\.item\.create|response\.create|input_chunks|session_id/.test(s)) return true;
  if (/"author"\s*:\s*\{[^}]*"role"\s*:\s*"user"/s.test(s)) return true;
  if (/"role"\s*:\s*"user"/.test(s) && /"content"|"parts"|"text"|"input_text"/.test(s)) return true;
  if (/"modelName"\s*:/.test(s) && /"message"\s*:/.test(s)) return true;
  if (/f\.req=/.test(s)) return true;
  if (/"contents"\s*:\s*\[/.test(s) && /"parts"/.test(s)) return true;
  return false;
}

function looksLikeUserText(s: string): boolean {
  if (s.length < 2) return false;
  if (UUID_RE.test(s.trim())) return false;
  if (/^PhoLine\b/.test(s)) return false;
  if (isPhoLine(s)) return false;
  if (/^https?:\/\//.test(s) && !/\s/.test(s)) return false;
  if (!/[A-Za-zÄÖÜäöüß]/.test(s)) return false;
  if (s.trimStart().startsWith("{") || s.trimStart().startsWith("[")) return false;
  if (/^[A-Za-z0-9+/_=-]{40,}$/.test(s) && !/\s/.test(s)) return false;
  if (s.length < 12 && /^\S+$/.test(s) && /[_./]/.test(s)) return false;
  return true;
}

export type RewriteHit = { from: string; to: string };

export type RewriteResult = {
  payload: unknown;
  primed: boolean;
  rewrites: RewriteHit[];
};

function encodeUserText(s: string, primed: boolean, inject: boolean): { text: string; primed: boolean } {
  let wire = encodeWire(s).wire;
  if (!primed && inject) {
    wire = `${SYSTEM_PROMPT}\n\n${wire}`;
    return { text: wire, primed: true };
  }
  return { text: wire, primed };
}

export function rewriteChatPayload(
  payload: unknown,
  opts: { primed: boolean; injectProtocol: boolean },
): RewriteResult {
  const rewrites: RewriteHit[] = [];
  let primed = opts.primed;
  const inject = opts.injectProtocol;

  function apply(s: string): string {
    if (!looksLikeUserText(s)) return s;
    const out = encodeUserText(s, primed, inject);
    primed = out.primed;
    if (out.text !== s) rewrites.push({ from: s, to: out.text });
    return out.text;
  }

  function walk(node: unknown, key: string | null, role: string | null): unknown {
    if (node == null) return node;
    if (typeof node === "string") {
      if (!key || !USER_KEYS.has(key)) return node;
      if (role === "assistant" || role === "system" || role === "tool" || role === "model" || role === "developer") {
        return node;
      }
      if (key === "content" && role !== "user") return node;
      if (role === "user" || key !== "content") return apply(node);
      return node;
    }
    if (Array.isArray(node)) {
      if (key === "parts" && role !== "assistant" && role !== "system" && role !== "tool" && role !== "model") {
        return node.map((item) => (typeof item === "string" ? apply(item) : walk(item, "parts", role)));
      }
      if (key === "input_chunks" && role !== "assistant" && role !== "system" && role !== "tool") {
        return node.map((item) => walk(item, "input_chunks", role));
      }
      if (key === "contents") {
        return node.map((item) => walk(item, "contents", role));
      }
      if (key === "input") {
        return node.map((item) => walk(item, "input", role));
      }
      if (key === "messages") {
        let arr = node as unknown[];
        const looksOpenAI = arr.every(
          (m) =>
            !m ||
            (typeof m === "object" && typeof (m as { role?: string }).role === "string"),
        );
        if (inject && !primed && looksOpenAI) {
          const hasSys = arr.some(
            (m) => m && typeof m === "object" && (m as { role?: string }).role === "system",
          );
          const hasUser = arr.some(
            (m) => m && typeof m === "object" && (m as { role?: string }).role === "user",
          );
          if (!hasSys && hasUser) {
            arr = [{ role: "system", content: SYSTEM_PROMPT }, ...arr];
            primed = true;
          }
        }
        return arr.map((item) => walk(item, "messages", role));
      }
      return node.map((item) => walk(item, key, role));
    }
    if (typeof node === "object") {
      const rec = node as Record<string, unknown>;
      let nextRole: string | null = role;
      if (typeof rec.role === "string") nextRole = rec.role;
      else if (rec.author && typeof rec.author === "object") {
        const authorRole = (rec.author as { role?: unknown }).role;
        if (typeof authorRole === "string") nextRole = authorRole;
      }
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rec)) {
        out[k] = walk(v, k, nextRole);
      }
      return out;
    }
    return node;
  }

  const next = walk(payload, null, null);
  return { payload: next, primed, rewrites };
}

export function rewriteRequestBody(
  body: string,
  url: string,
  opts: { primed: boolean; injectProtocol: boolean },
): { body: string; changed: boolean; primed: boolean; rewrites: RewriteHit[] } {
  const trimmed = body.trim();
  if (!trimmed) {
    return { body, changed: false, primed: opts.primed, rewrites: [] };
  }
  if (!isChatUrl(url) && !looksLikeChatPayload(trimmed)) {
    return { body, changed: false, primed: opts.primed, rewrites: [] };
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const json = JSON.parse(body) as unknown;
      const keyed = rewriteChatPayload(json, opts);
      if (keyed.rewrites.length) {
        return {
          body: JSON.stringify(keyed.payload),
          changed: true,
          primed: keyed.primed,
          rewrites: keyed.rewrites,
        };
      }
      const deep = rewriteDeepJson(json, {
        primed: keyed.primed,
        injectProtocol: opts.injectProtocol,
      });
      if (deep.rewrites.length) {
        return {
          body: JSON.stringify(deep.payload),
          changed: true,
          primed: deep.primed,
          rewrites: deep.rewrites,
        };
      }
      return { body, changed: false, primed: keyed.primed, rewrites: [] };
    } catch {
      return { body, changed: false, primed: opts.primed, rewrites: [] };
    }
  }

  if (body.includes("=") && /(?:message|prompt|text|query|input|f\.req|user_input)=/.test(body)) {
    try {
      const params = new URLSearchParams(body);
      const rewrites: RewriteHit[] = [];
      let primed = opts.primed;
      let changed = false;
      for (const key of ["message", "prompt", "text", "query", "input", "user_input"]) {
        const val = params.get(key);
        if (!val || !looksLikeUserText(val)) continue;
        const out = encodeUserText(val, primed, opts.injectProtocol);
        primed = out.primed;
        params.set(key, out.text);
        rewrites.push({ from: val, to: out.text });
        changed = true;
      }
      const freq = params.get("f.req");
      if (freq) {
        const nested = rewriteNestedJsonText(freq, { primed, injectProtocol: opts.injectProtocol });
        if (nested.changed) {
          params.set("f.req", nested.body);
          primed = nested.primed;
          rewrites.push(...nested.rewrites);
          changed = true;
        }
      }
      return { body: params.toString(), changed, primed, rewrites };
    } catch {
      return { body, changed: false, primed: opts.primed, rewrites: [] };
    }
  }
  return { body, changed: false, primed: opts.primed, rewrites: [] };
}

function rewriteNestedJsonText(
  raw: string,
  opts: { primed: boolean; injectProtocol: boolean },
): { body: string; changed: boolean; primed: boolean; rewrites: RewriteHit[] } {
  try {
    const parsed = JSON.parse(raw) as unknown;
    const walked = rewriteDeepJson(parsed, opts);
    if (!walked.rewrites.length) {
      return { body: raw, changed: false, primed: walked.primed, rewrites: [] };
    }
    return {
      body: JSON.stringify(walked.payload),
      changed: true,
      primed: walked.primed,
      rewrites: walked.rewrites,
    };
  } catch {
    return { body: raw, changed: false, primed: opts.primed, rewrites: [] };
  }
}

function rewriteDeepJson(
  node: unknown,
  opts: { primed: boolean; injectProtocol: boolean },
): RewriteResult {
  const viaKeys = rewriteChatPayload(node, opts);
  if (viaKeys.rewrites.length) return viaKeys;

  const rewrites: RewriteHit[] = [];
  let primed = opts.primed;

  function walk(n: unknown): unknown {
    if (typeof n === "string") {
      const trimmed = n.trim();
      if ((trimmed.startsWith("{") || trimmed.startsWith("[")) && n.length > 8) {
        try {
          const inner = JSON.parse(n) as unknown;
          const next = walk(inner);
          const encoded = JSON.stringify(next);
          if (encoded !== n) return encoded;
        } catch {
          /* keep */
        }
      }
      if (looksLikeUserText(n) && n.split(/\s+/).length >= 3) {
        const out = encodeUserText(n, primed, opts.injectProtocol);
        primed = out.primed;
        if (out.text !== n) rewrites.push({ from: n, to: out.text });
        return out.text;
      }
      return n;
    }
    if (Array.isArray(n)) return n.map(walk);
    if (n && typeof n === "object") {
      const rec = n as Record<string, unknown>;
      const role = typeof rec.role === "string" ? rec.role : null;
      if (role === "assistant" || role === "system" || role === "tool" || role === "model") {
        return n;
      }
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rec)) out[k] = walk(v);
      return out;
    }
    return n;
  }

  return { payload: walk(node), primed, rewrites };
}
