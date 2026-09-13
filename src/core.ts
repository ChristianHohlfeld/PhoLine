import { decode, encodeWire, type WireTrace } from "./codec";
import { countTokens, type TokenEnc } from "./count";

export {
  decode,
  encodeWire,
  isChatUrl,
  isPhoLine,
  rewriteChatPayload,
  rewriteRequestBody,
  stripMark,
  SYSTEM_PROMPT,
  WIRE_MARK,
  type Kept,
  type RewriteHit,
  type RewriteResult,
  type WireTrace,
} from "./codec";

export type EncodeTrace = WireTrace & {
  naiveIpa: string;
  expandedDe: string;
  expandedEn: string;
  tokensOriginal: number;
  tokensCompact: number;
  tokensNaiveIpa: number;
  tokensExpandedDe: number;
  savedPct: number;
  ipaDeltaPct: number;
};

/** Internal phen-ish ASCII for the *wrong* test the other AIs ran. Never the channel. */
export function naiveIpa(word: string): string {
  let w = word
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
  const rules: [RegExp, string][] = [
    [/tsch/g, "tS"],
    [/sch/g, "S"],
    [/chs/g, "ks"],
    [/ch/g, "C"],
    [/ck/g, "k"],
    [/tz/g, "ts"],
    [/ie/g, "i:"],
    [/ei|ai/g, "ai"],
    [/eu|aeu|äu/g, "oy"],
    [/au/g, "au"],
    [/ph/g, "f"],
    [/qu/g, "kv"],
    [/ng/g, "N"],
    [/dt/g, "t"],
    [/ß|ss/g, "s"],
    [/z/g, "ts"],
    [/w/g, "v"],
    [/v/g, "f"],
    [/j/g, "j"],
    [/c/g, "k"],
    [/y/g, "y"],
  ];
  for (const [re, to] of rules) w = w.replace(re, to);
  return w;
}

function naiveIpaText(text: string): string {
  return text
    .split(/(\s+)/)
    .map((part) => (/[A-Za-zÄÖÜäöüß]/.test(part) ? naiveIpa(part) : part))
    .join("");
}

export function encode(original: string, enc: TokenEnc = "o200k"): EncodeTrace {
  const wire = encodeWire(original);
  const naive = naiveIpaText(original);
  const expandedDe = decode(wire.wire, "de");
  const expandedEn = decode(wire.wire, "en");
  const tokensOriginal = countTokens(original, enc);
  const tokensCompact = countTokens(wire.wire, enc);
  const tokensNaiveIpa = countTokens(naive, enc);
  const tokensExpandedDe = countTokens(expandedDe, enc);
  const savedPct =
    tokensOriginal === 0 ? 0 : Math.round((1 - tokensCompact / tokensOriginal) * 1000) / 10;
  const ipaDeltaPct =
    tokensOriginal === 0
      ? 0
      : Math.round((tokensNaiveIpa / tokensOriginal - 1) * 1000) / 10;

  return {
    ...wire,
    naiveIpa: naive,
    expandedDe,
    expandedEn,
    tokensOriginal,
    tokensCompact,
    tokensNaiveIpa,
    tokensExpandedDe,
    savedPct,
    ipaDeltaPct,
  };
}

export function ratioLabel(m: number, n: number): string {
  if (n <= 0) return "—";
  return (m / n).toFixed(2);
}
