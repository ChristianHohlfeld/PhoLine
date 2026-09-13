# PhoLine wire protocol

**Author:** Christian Heinrich Hohlfeld, B.Sc.  
**ORCID:** [0009-0003-6634-9045](https://orcid.org/0009-0003-6634-9045)

This is the on-the-wire contract used by the Chrome extension and by the
TypeScript codec. It is a research prototype of Stage I of PhO-Compress
applied to ordinary hosted LLMs.

## 1. Mark

Every PhoLine message starts with the pilcrow `¶` (U+00B6), then a space,
then the channel body.

```
¶ bund pass draft data store. crit warn privacy grab.
```

Unmarked text is ordinary language and must not be decoded as a codebook.

## 2. Channel alphabet

Channel tokens are short English content-stems chosen so that, after a
space, they are typically **one token** in `o200k_base` / `cl100k_base`.

Examples from `src/lexicon.ts`:

| surface (DE)     | channel | why                         |
|------------------|---------|-----------------------------|
| Bundestag        | bund    | 1 token, task-sufficient    |
| Kompression      | pack    | 1 token                     |
| Tokenizer        | tok     | 1 token                     |
| Privatsphäre     | privacy | 1 token                     |
| Architektur      | arch    | 1 token                     |
| orthographisch   | spell   | 1 token                     |

The codebook is the transport. IPA is **not**.

## 3. Drop list

Determiners, copulas, auxiliaries, pronouns, light prepositions and
hedges are dropped. They are reconstructed by the client decoder from
the stem stream, not paid for on the wire.

German examples: `der die das ein und ist hat ich in nicht nur auch`
English examples: `the a an and or is are have i you this that just`

Negation that flips a decision should stay in later revisions. The
current drop list is aggressive; treat it as S-sufficient, not lossless.

## 4. Side-channel U

Spans that must survive **exactly** are extracted before mapping:

- `https://…` URLs
- email addresses
- `` `code` ``
- numbers
- long ALL-CAPS identifiers

They are replaced with `⟦U0⟧`, `⟦U1⟧`, … during mapping and restored
afterwards. This is the browser-side counterpart of \(U\) in
PhO-Compress.

## 5. Model protocol

On the first rewritten request of a tab session the extension prefixes
the compact user turn with `SYSTEM_PROMPT` from `src/codec.ts`.

The model is instructed to:

- start every reply with `¶`
- speak only codebook stems
- keep numbers, URLs, code, proper names exact
- skip greetings, hedges, restating the question

The client expands `¶` replies in the page (German or English).

## 6. What this is not

- Not a G2P dump onto BPE.
- Not a request that the model "write shorter".
- Not optical Stage II (\(\mathcal{E}_V\)).
- Not a guarantee of provider billing savings.

The research metric is:

```
task-relevant information / tokenizer token
```
