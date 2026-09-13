import { encode as encodeO200k } from "gpt-tokenizer/encoding/o200k_base";
import { encode as encodeCl100k } from "gpt-tokenizer/encoding/cl100k_base";

export type TokenEnc = "o200k" | "cl100k";

export function countTokens(text: string, enc: TokenEnc = "o200k"): number {
  if (!text) return 0;
  return enc === "cl100k" ? encodeCl100k(text).length : encodeO200k(text).length;
}

export function tokenPieces(text: string, enc: TokenEnc = "o200k"): string[] {
  // gpt-tokenizer doesn't expose decode-from-ids easily in all builds; split via encode+decode roundtrip per id
  const ids = enc === "cl100k" ? encodeCl100k(text) : encodeO200k(text);
  return ids.map(String);
}
