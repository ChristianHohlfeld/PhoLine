import {
  decode,
  encodeWire,
  isChatUrl,
  isPhoLine,
  rewriteChatPayload,
  rewriteRequestBody,
  stripMark,
  SYSTEM_PROMPT,
  WIRE_MARK,
} from "./codec";

const api = {
  WIRE_MARK,
  SYSTEM_PROMPT,
  encode(original: string) {
    return encodeWire(original);
  },
  decode,
  isPhoLine,
  isChatUrl,
  rewriteChatPayload,
  rewriteRequestBody,
  stripMark,
};

const g = globalThis as typeof globalThis & { PhoLine?: typeof api };
g.PhoLine = api;
