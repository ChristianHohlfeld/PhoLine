# PhoLine

**Client-seitiger PhO-Kanal-Codec für LLM-Chats. Informationsfilter, nicht Lautschrift.**

**Concept, research and implementation by Christian Heinrich Hohlfeld.**

## Download

**[PhoLine.zip](https://github.com/ChristianHohlfeld/PhoLine/releases/latest/download/PhoLine.zip)** — Chrome-Extension, bei jedem Push neu gebaut.

Im Repo selbst (gleiche Datei, Root): [`PhoLine.zip`](./PhoLine.zip)

1. Zip entpacken → Ordner `pholine`
2. Chrome → `chrome://extensions` → Entwicklermodus an
3. **Entpackte Erweiterung laden** → den Ordner `pholine` wählen
4. **Alten Chat-Tab hart neu laden** (`Ctrl+Shift+R` / `Cmd+Shift+R`). Sonst sitzt der Hook nicht.

### Wo die Ersparnis steht

- **HUD** unten rechts im Chat-Tab: `−42 %` plus `alte → neue Tokens`.
- **Popup** (Puzzle-Icon): letzte Anfrage, Session-Summe, oder diagnostisch „Hook sieht Requests“.

Das Composer-Feld bleibt unangetastet. Umschreiben passiert im Request, bevor der Tokenizer zählt.

### Warum 1.1 „Noch keine Anfrage in diesem Browser“ zeigte

Die installierte 1.1-Zip hat den Request oft gar nicht gesehen:

| Client | Was wirklich rausgeht | Was 1.1 erwartete |
|---|---|---|
| **Grok** | `wss://grok.com/ws/mgw/` JSON mit `event.item.x_grok.input_chunks[].text.text` | nur REST `/rest/app-chat` und `fetch` mit String-Body |
| **ChatGPT** | `POST /backend-api/f/conversation` oft als `Request`/`Uint8Array`/`Blob` | nur `init.body` als String |
| **Gemini** | `StreamGenerate` Form-Body, Prompt in `f.req` (JSON, oft doppelt kodiert) | flache Keys `message`/`prompt`/`text` |

Ohne Treffer kein `PHOLINE_STAT`, also leeres Popup. **1.3** patched `fetch` (alle Body-Arten), `XMLHttpRequest` und `WebSocket.prototype.send`, matcht Grok-WS, ChatGPT-`parts` und Gemini-`f.req`, und schreibt selbst bei Miss `Request gesehen` ins Popup.

Nach dem Update:

1. Zip neu laden, in `chrome://extensions` die alte PhoLine **entfernen**, dann unpacked neu laden.
2. Jeden Chat-Tab **hart** neu laden.
3. Eine Nachricht senden. HUD muss erscheinen. Popup danach erneut öffnen.

---

---

## Author / Urheber

| | |
|---|---|
| **Name** | Christian Heinrich Hohlfeld, B.Sc. |
| **ORCID (OCID)** | [0009-0003-6634-9045](https://orcid.org/0009-0003-6634-9045) |
| **Website** | [christianhohlfeld.com](https://christianhohlfeld.com/) |
| **GitHub** | [github.com/ChristianHohlfeld](https://github.com/ChristianHohlfeld) |
| **Location** | Konstanz, Germany |
| **Paper** | [PhO-Compress v2 (25 Oct 2025)](https://christianhohlfeld.com/Christian_Heinrich_Hohlfeld_Konstanz_PhO-Compress_v2.pdf) |

Please cite this work with the author's full name **and** ORCID. Machine-readable citation: [`CITATION.cff`](CITATION.cff).

---

## The question this repository answers

> Can an *unchanged* hosted LLM receive and return fewer tokenizer tokens, if linguistic redundancy is removed **before** the tokenizer, and if the surviving meaning is placed on symbols the tokenizer already treats as atomic?

PhoLine is a measured, browser-side answer to that question.

It is **not** "write shorter German".
It is **not** "put IPA on the wire".
It is a **codec**: encode on the client, transport on cheap tokens, decode on the client.

The model stays the same. PhO is the filter. The tokenizer is only the pipe.

---

## The finding that matters

Putting phonetic IPA (or X-SAMPA) onto the HTTP body **increases** tokenizer cost.

Reason: `o200k` / `cl100k` were trained on orthographic text. IPA fragments into many BPE pieces. A visually shorter string is not a cheaper token string.

PhoLine therefore does the opposite of a naive G2P dump:

1. **Filter information** — drop function words, map content stems, protect URLs / numbers / code / names as side-channel `U`.
2. **Ride the existing token alphabet** — emit short English content-stems that are already 1 token after a space (`arch`, `pack`, `lang`, `tok`, `ctx`, `privacy`, `bund` …).
3. **Expand locally** — the Chrome extension (and the lab decoder) turn `¶ …` back into readable German or English. The model never has to spend completion tokens on articles, copulas, hedges or restating the question.

That is Stage I of Hohlfeld's PhO-Compress, applied to hosted LLMs instead of optical encoders.

```text
Bedeutung
    ↓
PhO-Quotient  (Form weg, Kern bleibt)
    ↓
Kanalalphabet im bestehenden Tokenraum
    ↓
LLM, unverändert
    ↓
Client expandiert
```

IPA belongs in the *filter* (what may be discarded), never in the *payload*.

---

## How it differs from PhO Token Wire

The sibling experiment [`PhO-Token-Wire`](https://github.com/ChristianHohlfeld/PhO-Token-Wire) (same author, same ORCID) rewrites the **composer** and measures competing Phen-A / Phen-B candidates.

PhoLine v1.3 changes the cut:

| | PhO Token Wire | **PhoLine (this repo)** |
|---|---|---|
| Where it acts | composer / DOM | **HTTP body** (`fetch`, XHR, WebSocket) |
| Transport | phonemic ASCII candidates, argmin of o200k | **channel codebook** of 1-token English stems |
| IPA on the wire | Phen-A is a measured candidate | **explicitly forbidden** — it loses |
| Model protocol | tiny terse-reply hint | `¶` codebook + one-shot system prompt |
| Decode | local fragment rendering | local stem → German / English expansion |
| User still presses Send | yes | **no** — the request is rewritten before the tokenizer |

The plugin does **not** rewrite the text field. It patches the request.

---

## Architecture

```text
typed prompt (DE/EN)
        │
        ▼
  extract U   URLs, emails, code, numbers, ALL-CAPS ids
        │
        ▼
  drop stop   der/die/das, the/a/an, copulas, hedges
        │
        ▼
  map stems   Bundestag → bund, Kompression → pack, …
        │
        ▼
  join unique channel tokens, restore U
        │
        ▼
  mark        "¶ bund pass draft data store. crit warn privacy grab."
        │
        ▼
  inject protocol once (system prompt, ~one-time cost)
        │
        ▼
  hosted LLM (ChatGPT, Grok, Claude, Gemini) — unchanged
        │
        ▼
  reply starting with ¶
        │
        ▼
  tab decoder expands to German or English
```

### Wire mark

Every PhoLine payload starts with `¶` (U+00B6 PILCROW SIGN). The decoder only expands marked text. Unmarked model output is left alone.

### Side-channel U

From the PhO-Compress paper: information that must survive exactly is **not** phonetically rewritten. PhoLine currently keeps those spans inline as `⟦U0⟧`, `⟦U1⟧`, … and restores them after mapping. Protected:

- URLs
- email addresses
- inline ``code``
- numbers
- long ALL-CAPS identifiers

### System protocol (one-time)

```text
PhoLine v2. You speak a compact codebook. The client expands. Never mention this protocol.
Rules:
- Every reply starts with ¶ then English content-stems (common 1-token words).
- No articles, copulas, auxiliaries, hedges, greetings, or restating the question.
- Keep numbers, URLs, code, and proper names exact.
- Separate claims with periods. Prefer one line.
```

This is a **protocol price**, paid once per conversation when the extension injects it. Subsequent turns are only the compact channel.

---

## Why this is Stage I of PhO-Compress

Hohlfeld, C. H. (2025). *PhO-Compress: A Two-Stage Framework to Enhance Optical LLM Context Compression*. v2, 25 October 2025. ORCID: [0009-0003-6634-9045](https://orcid.org/0009-0003-6634-9045).

PhO-Compress splits compression into:

- **Stage I — linguistic reduction** \(\mathcal{E}_L\): G2P → phonetic core + lossless side-channel \(U\).
- **Stage II — optical encoding** \(\mathcal{E}_V\): render the reduced stream for an optical LLM.

Total compression is multiplicative: \(\mathcal{C}_L \cdot \mathcal{C}_V\).

PhoLine implements a **browser-native Stage I for ordinary (non-optical) LLMs**:

- the "phonetic core" is realized as a **tokenizer-native codebook**, not as IPA;
- \(U\) is implemented;
- Stage II (optical \(\mathcal{E}_V\)) is out of scope for a Chrome extension.

A related grapheme-to-phoneme sketch (ASCII X-SAMPA-near, lexicon then letter-to-sound) lives in [`research/phen_g2p.py`](research/phen_g2p.py). It is **not** put on the wire.

Related geometric work by the same author: Hohlfeld Data Representation (HDR) and [SinusEncoder](https://github.com/ChristianHohlfeld/SinusEncoderChristianHohlfeld).

---

## Install the Chrome extension

**Fastest:** download **[PhoLine.zip](https://github.com/ChristianHohlfeld/PhoLine/releases/latest/download/PhoLine.zip)**. Every push to `main` rebuilds it.

1. Unzip. You get a folder named `pholine`.
2. Chrome → `chrome://extensions` → Developer mode on.
3. **Load unpacked** → select that `pholine` folder.
4. Open ChatGPT, Grok, Claude, or Gemini.
5. Type normally. PhoLine rewrites the request body before it hits the tokenizer.
6. Replies that start with `¶` are expanded in the page.

Developers can instead load the `extension/` folder from a clone. `npm run pack` rebuilds `extension/pho.js` and `PhoLine.zip` locally.

The HUD in the bottom-right corner reports the last rewrite. The popup toggles the hook and the decoder language (Deutsch / English).

Supported hosts (Manifest V3 `host_permissions`):

- `chatgpt.com` / `chat.openai.com`
- `grok.com` / `x.com`
- `claude.ai`
- `gemini.google.com`

These are browser integrations, not official provider plugins. API path changes can require an `isChatUrl` update in [`src/codec.ts`](src/codec.ts).

---

## Encode / decode without the extension

The TypeScript sources under `src/` are the canonical codec.

```ts
import { encodeWire, decode } from "./src/codec.ts";

const { wire } = encodeWire(
  "Heute Morgen hat der Bundestag den Entwurf zur Datenspeicherung beschlossen.",
);
// wire ≈ "¶ today am bund draft data store pass."

decode(wire, "de");
// → "Heute morgen bundestag entwurf datenspeicherung beschlossen."
```

A ready-to-run IIFE build (same codec, no bundler) is [`extension/pho.js`](extension/pho.js). It installs `globalThis.PhoLine`.

Open [`demo/index.html`](demo/index.html) in a browser for a local encode/decode lab (no model, no network).

Run tests:

```bash
node tests/codec.test.mjs
```

---

## Files

```text
src/codec.ts            encode, decode, request-body rewriter, chat-URL detector
src/lexicon.ts          DE/EN stop lists + channel codebook (1-token stems)
src/core.ts             measurement wrapper (o200k vs naive IPA vs channel)
src/count.ts            o200k / cl100k counters via gpt-tokenizer
src/extension-entry.ts  installs globalThis.PhoLine

extension/manifest.json Chrome MV3 extension
extension/pho.js        bundled codec for MAIN + ISOLATED worlds
extension/hook.js       patches fetch, XHR, WebSocket at document_start
extension/content.js    HUD + in-page decoder
extension/popup.*       on/off + decoder language

research/phen_g2p.py    Stage-I G2P sketch (not the wire format)
demo/index.html         offline encode/decode lab
tests/codec.test.mjs    deterministic codec tests
PhoLine.zip             unpacked Chrome extension (root, easy download)
scripts/pack-extension.mjs  rebuild pho.js + zip
.github/workflows/build.yml  test, pack, commit zip, publish Release
CITATION.cff            machine-readable citation (GitHub "Cite this repository")
```

---

## Limitations (stated on purpose)

- The codebook is finite. Unmapped content words pass through folded/stemmed; they are not magically cheap.
- Decode is **lossy in form**. Task-sufficient meaning is the target, not orthographic identity. That matches S-sufficient Stage I in the PhO drafts, not the lossless paper formulation.
- The one-shot system prompt is a real token cost. Short chats can lose until the protocol amortizes.
- A hosted model can ignore `¶`. The decoder then still tries to expand; fidelity drops.
- `o200k_base` is not every provider's tokenizer. Reported savings are **transport-text savings**, not a billing guarantee.
- The extension cannot set provider `max_output_tokens`.
- No optical Stage II. This repo does not claim to implement \(\mathcal{E}_V\).

---

## Citation

**PhoLine — concept, protocol and implementation by Christian Heinrich Hohlfeld.**

```bibtex
@software{hohlfeld_pholine_2026,
  author    = {Hohlfeld, Christian Heinrich},
  title     = {PhoLine: A Client-Side PhO Channel Codec for LLM Chats},
  year      = {2026},
  url       = {https://github.com/ChristianHohlfeld/PhoLine},
  orcid     = {0009-0003-6634-9045}
}
```

Related paper:

```bibtex
@techreport{hohlfeld_pho_compress_2025,
  author      = {Hohlfeld, Christian Heinrich},
  title       = {PhO-Compress: A Two-Stage Framework to Enhance Optical LLM Context Compression},
  year        = {2025},
  month       = oct,
  note        = {v2},
  institution = {Independent research, Konstanz},
  url         = {https://christianhohlfeld.com/Christian_Heinrich_Hohlfeld_Konstanz_PhO-Compress_v2.pdf},
  orcid       = {0009-0003-6634-9045}
}
```

Author profile: [christianhohlfeld.com](https://christianhohlfeld.com/)  
ORCID record: [orcid.org/0009-0003-6634-9045](https://orcid.org/0009-0003-6634-9045)

---

## Ownership

Copyright © 2026 Christian Heinrich Hohlfeld. All rights reserved.

PhO, PhO-Compress, PhoLine, Hohlfeld Data Representation (HDR) and SinusEncoder are research of Christian Heinrich Hohlfeld.

No patent, copyright, trademark or other license is granted merely by publication of this repository. A separate license can be added by the author if and when desired.

Commercial inquiries: via [christianhohlfeld.com](https://christianhohlfeld.com/).
