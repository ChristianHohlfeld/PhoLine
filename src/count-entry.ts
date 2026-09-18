import { countTokens } from "./count";

const g = globalThis as typeof globalThis & {
  PhoLineCount?: { countTokens: typeof countTokens };
};
g.PhoLineCount = { countTokens };
