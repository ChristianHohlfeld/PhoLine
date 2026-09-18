#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { encode as encodeO200k } from "gpt-tokenizer/encoding/o200k_base";
import { PROMPTS } from "./prompts.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const bundle = readFileSync(join(root, "extension", "pho.js"), "utf8");
eval(bundle);
const Pho = globalThis.PhoLine;
if (!Pho) throw new Error("PhoLine bundle did not install globalThis.PhoLine");

const count = (s) => encodeO200k(String(s || "")).length;
const pct = (a, b) => a ? ((a - b) / a) * 100 : 0;
const round = (n, d = 1) => Number(n.toFixed(d));
const sum = (xs, f) => xs.reduce((n, x) => n + f(x), 0);
const median = (xs) => {
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
};

function literals(text) {
  return text.match(/https?:\/\/\S+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\b\d+(?:[.,]\d+)*\b|\b[A-Z]{2,}[A-Z0-9_]{1,}\b/g) || [];
}

const polaritySource = /\b(nicht|nie|niemals|ohne|kein(?:e|en|er|es)?|not|never|without|no)\b|don't|do not|must not|mustn't/i;
const polarityWire = /\b(not|never|without|none|no|nicht|nie|niemals|ohne|kein)\b/i;
const exclusiveSource = /\b(nur|only)\b/i;
const exclusiveWire = /\b(only|nur)\b/i;

const rows = PROMPTS.map((p) => {
  const out = Pho.encode(p.text);
  const originalTokens = count(p.text);
  const wireTokens = count(out.wire);
  const exact = literals(p.text);
  const missingLiterals = exact.filter((x) => !out.wire.includes(x));
  const hasPolarity = polaritySource.test(p.text);
  const polarityKept = !hasPolarity || polarityWire.test(out.wire);
  const hasExclusive = exclusiveSource.test(p.text);
  const exclusiveKept = !hasExclusive || exclusiveWire.test(out.wire);
  const q = p.text.trim().endsWith("?");
  const bang = p.text.trim().endsWith("!");
  const moodKept = (!q || out.wire.trim().endsWith("?")) && (!bang || out.wire.trim().endsWith("!"));
  return {
    ...p, wire: out.wire, decodedDe: Pho.decode(out.wire, "de"),
    originalTokens, wireTokens, savedTokens: originalTokens - wireTokens,
    savedPct: round(pct(originalTokens, wireTokens)), missingLiterals,
    literalRetention: missingLiterals.length === 0, hasPolarity, polarityKept,
    hasExclusive, exclusiveKept, moodKept
  };
});

const protocolTokens = count(Pho.SYSTEM_PROMPT);
const origTotal = sum(rows, (r) => r.originalTokens);
const wireTotal = sum(rows, (r) => r.wireTokens);
const rawSaved = origTotal - wireTotal;
const rawSavedPct = pct(origTotal, wireTotal);
const withProtocol = wireTotal + protocolTokens;
const netSavedPct = pct(origTotal, withProtocol);
const avgSaved = rawSaved / rows.length;
const breakEvenTurns = avgSaved > 0 ? Math.ceil(protocolTokens / avgSaved) : null;

const byCategory = Object.values(rows.reduce((acc, r) => {
  const x = acc[r.category] ||= { category: r.category, n: 0, original: 0, wire: 0, risks: 0 };
  x.n += 1; x.original += r.originalTokens; x.wire += r.wireTokens;
  if (!r.literalRetention || !r.polarityKept || !r.exclusiveKept || !r.moodKept) x.risks += 1;
  return acc;
}, {})).map((x) => ({ ...x, savedPct: round(pct(x.original, x.wire)) }));

const summary = {
  corpus: rows.length,
  tokenizer: "o200k_base via gpt-tokenizer",
  protocolTokens,
  originalTokens: origTotal,
  wireTokens: wireTotal,
  rawSavedTokens: rawSaved,
  rawSavedPct: round(rawSavedPct),
  netSavedPct100TurnSession: round(netSavedPct),
  meanSavedPctPerPrompt: round(sum(rows, (r) => r.savedPct) / rows.length),
  medianSavedPctPerPrompt: round(median(rows.map((r) => r.savedPct))),
  promptsCheaper: rows.filter((r) => r.savedTokens > 0).length,
  promptsEqual: rows.filter((r) => r.savedTokens === 0).length,
  promptsMoreExpensive: rows.filter((r) => r.savedTokens < 0).length,
  breakEvenTurnsApprox: breakEvenTurns,
  literalFailures: rows.filter((r) => !r.literalRetention).length,
  polarityFailures: rows.filter((r) => !r.polarityKept).length,
  exclusivityFailures: rows.filter((r) => !r.exclusiveKept).length,
  moodFailures: rows.filter((r) => !r.moodKept).length
};

const risks = rows.filter((r) => !r.literalRetention || !r.polarityKept || !r.exclusiveKept || !r.moodKept);
const lines = [
  "# PhoLine benchmark", "",
  "100 deterministic representative prompts. Synthetic corpus; no private chat logs.", "",
  "## Token result", "",
  "| Metric | Result |", "|---|---:|",
  "| Original tokens | " + summary.originalTokens + " |",
  "| Wire tokens | " + summary.wireTokens + " |",
  "| Raw input-token saving | **" + summary.rawSavedPct + "%** |",
  "| One-shot protocol | +" + summary.protocolTokens + " tokens |",
  "| Net saving across this 100-turn corpus/session | **" + summary.netSavedPct100TurnSession + "%** |",
  "| Approx. break-even turns at this corpus mix | " + (summary.breakEvenTurnsApprox ?? "never") + " |",
  "| Prompts cheaper / equal / more expensive | " + summary.promptsCheaper + " / " + summary.promptsEqual + " / " + summary.promptsMoreExpensive + " |", "",
  "## Semantic-invariant risk checks", "",
  "| Invariant | Failures |", "|---|---:|",
  "| Exact literals (URL/email/numbers/IDs) | " + summary.literalFailures + " |",
  "| Negation / polarity marker | **" + summary.polarityFailures + "** |",
  "| Exclusivity marker (nur/only) | **" + summary.exclusivityFailures + "** |",
  "| Question/exclamation mood | " + summary.moodFailures + " |", "",
  "These are structural risk checks, not an LLM answer-quality score.", "",
  "## Categories", "",
  "| Category | n | Original | Wire | Saving | Risk flags |", "|---|---:|---:|---:|---:|---:|",
  ...byCategory.map((x) => "| " + x.category + " | " + x.n + " | " + x.original + " | " + x.wire + " | " + x.savedPct + "% | " + x.risks + " |"),
  "", "## Risk examples", ""
];
for (const r of risks.slice(0, 20)) {
  lines.push("### " + r.id, "Original: " + r.text, "Wire: " + r.wire,
    "Flags: literal=" + r.literalRetention + ", polarity=" + r.polarityKept + ", exclusive=" + r.exclusiveKept + ", mood=" + r.moodKept, "");
}

mkdirSync(join(here, "out"), { recursive: true });
writeFileSync(join(here, "out", "results.json"), JSON.stringify({ summary, byCategory, rows }, null, 2));
writeFileSync(join(here, "out", "summary.md"), lines.join("\n"));
console.log(JSON.stringify(summary, null, 2));
