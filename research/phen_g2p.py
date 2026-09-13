#!/usr/bin/env python3
"""German grapheme-to-phoneme (Phen Stage I, L0).

ASCII phone set (X-SAMPA-near). No Unicode IPA.
Lexicon first, then longest-match letter-to-sound rules.

Author: Christian Heinrich Hohlfeld, B.Sc., Konstanz
ORCID:  https://orcid.org/0009-0003-6634-9045
Paper:  PhO-Compress v2, 25 October 2025
Note:   This is a Stage-I G2P sketch. It is NOT the PhoLine wire format.
        Putting these phones on an LLM tokenizer increases token count.
"""
from __future__ import annotations

import argparse
import re
import unicodedata
from dataclasses import dataclass
from typing import Iterable

# ---------------------------------------------------------------------------
# Inventory
# ---------------------------------------------------------------------------

CONSONANTS = frozenset(
    "pbtdkgfvszSZxChmnNlrj"
)
VOWELS = frozenset(
    {
        "I",
        "i:",
        "E",
        "e:",
        "a",
        "a:",
        "O",
        "o:",
        "U",
        "u:",
        "Y",
        "y:",
        "2",
        "2:",
        "E:",
        "9",
        "@",
        "6",
        "ai",
        "au",
        "oy",
    }
)

PHONE_RE = re.compile(
    r"i:|e:|E:|a:|o:|u:|y:|2:|ai|au|oy|tS|dZ|pf|ts|ks|"
    r"[pbtdkgfvszSZxChmnNlrjIEOUaUY29@6]"
)


# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class G2PWord:
    word: str
    phones: tuple[str, ...]
    source: str  # "lex" | "rules" | "passthrough"

    def samsa(self) -> str:
        return "".join(self.phones)


# ---------------------------------------------------------------------------
# High-frequency / irregular lexicon (citation Hochdeutsch)
# ---------------------------------------------------------------------------

LEXICON: dict[str, tuple[str, ...]] = {}


def parse_phones(samsa: str) -> tuple[str, ...]:
    """Accept space-separated phones, or packed strings using the inventory."""
    samsa = samsa.strip()
    alias = {"i": "I", "e": "E", "o": "O", "u": "U", "y": "Y"}
    if " " in samsa:
        parts = [alias.get(p, p) for p in samsa.split() if p]
        return tuple(parts)
    return tuple(alias.get(p, p) for p in PHONE_RE.findall(samsa))


def _lex(word: str, samsa: str) -> None:
    LEXICON[word] = parse_phones(samsa)


def _boot_lexicon() -> None:
    pairs = {
        "der": "de:6",
        "die": "di:",
        "das": "das",
        "dass": "das",
        "und": "Unt",
        "ist": "Ist",
        "ich": "IC",
        "nicht": "nICt",
        "ein": "ain",
        "eine": "ain@",
        "einer": "ain6",
        "einem": "ain@m",
        "einen": "ain@n",
        "eines": "ain@s",
        "zu": "tsu:",
        "von": "fOn",
        "mit": "mIt",
        "auf": "auf",
        "fuer": "fy:6",
        "für": "fy:6",
        "sich": "zIC",
        "im": "Im",
        "in": "In",
        "den": "de:n",
        "des": "dEs",
        "dem": "de:m",
        "auch": "aux",
        "an": "an",
        "es": "Es",
        "als": "als",
        "hat": "hat",
        "sie": "zi:",
        "so": "zo:",
        "noch": "nOx",
        "nur": "nu:6",
        "oder": "o:d6",
        "aber": "a:b6",
        "nach": "na:x",
        "wenn": "vEn",
        "sein": "zain",
        "seine": "zain@",
        "seiner": "zain6",
        "um": "Um",
        "aus": "aus",
        "bei": "bai",
        "durch": "dUrC",
        "ueber": "y:b6",
        "über": "y:b6",
        "vor": "fo:6",
        "bis": "bIs",
        "mehr": "me:6",
        "schon": "So:n",
        "hier": "hi:6",
        "dann": "dan",
        "alle": "al@",
        "alles": "al@s",
        "dieser": "di:z6",
        "diese": "di:z@",
        "dieses": "di:z@s",
        "kann": "kan",
        "kannst": "kanst",
        "soll": "zOl",
        "sollte": "zOlt@",
        "muss": "mUs",
        "muß": "mUs",
        "muss": "mUs",
        "muessen": "mYs@n",
        "müssen": "mYs@n",
        "wird": "vIrt",
        "wurde": "vUrd@",
        "worden": "vOrd@n",
        "werden": "ve:6d@n",
        "haben": "ha:b@n",
        "hatte": "hat@",
        "hatten": "hat@n",
        "gesagt": "g@za:kt",
        "system": "zYste:m",
        "architektur": "a r C i t E k t u: 6",
        "hybrid": "h Y b r i: t",
        "neue": "n oy @",
        "neu": "n oy",
        "entworfen": "E n t v O r f @ n",
        "wie": "vi:",
        "wir": "vi:6",
        "was": "vas",
        "wer": "ve:6",
        "wo": "vo:",
        "war": "va:6",
        "waren": "va:r@n",
        "noch": "nOx",
        "sehr": "ze:6",
        "gut": "gu:t",
        "grosse": "gro:s@",
        "große": "gro:s@",
        "gross": "gro:s",
        "groß": "gro:s",
        "mal": "ma:l",
        "man": "man",
        "da": "da:",
        "dort": "dOrt",
        "jetzt": "jEtst",
        "immer": "Im6",
        "wieder": "vi:d6",
        "kein": "kain",
        "keine": "kain@",
        "keiner": "kain6",
        "etwas": "Etvas",
        "nichts": "nICts",
        "viel": "fi:l",
        "viele": "fi:l@",
        "noch": "nOx",
        "ohne": "o:n@",
        "zwischen": "tsvIS@n",
        "unter": "Unt6",
        "ueber": "y:b6",
        "gegen": "ge:g@n",
        "weil": "vail",
        "obwohl": "opvo:l",
        "dass": "das",
        "ob": "Op",
        "also": "alzo:",
        "bereits": "b@raits",
        "heute": "h oy t @",
        "morgen": "m O r g @ n",
        "jahr": "j a: 6",
        "jahre": "j a: r @",
        "zeit": "ts ai t",
        "leute": "l oy t @",
        "mensch": "m E n S",
        "menschen": "m E n S @ n",
        "deutschland": "d oy t S l a n t",
        "deutsch": "d oy t S",
        "sprache": "Spra:x@",
        "text": "tEkst",
        "modell": "modEl",
        "token": "to:k@n",
        "tokens": "to:k@ns",
        "kompression": "k O m p r E s i o: n",
        "phonem": "f o n e: m",
        "phoneme": "f o n e: m @",
        "psychologie": "p s Y C o l o: g i:",
        "ingenieur": "I n Z e n i: 6",
        "laut": "laut",
        "schrift": "SrIft",
        "ich": "IC",
        "mich": "mIC",
        "dich": "dIC",
        "sich": "zIC",
        "euch": "oy C",
        "auch": "aux",
        "noch": "nOx",
        "doch": "dOx",
        "fach": "fax",
        "dach": "dax",
        "buch": "bu:x",
        "tuch": "tu:x",
        "loch": "lOx",
        "hoch": "ho:x",
        "nach": "na:x",
        "sechs": "zEks",
        "wachstum": "vakstu:m",
        "wachsen": "vaks@n",
        "wichtig": "vICtIC",
        "fertig": "fE6tIC",
        "moeglich": "m2:klIC",
        "möglich": "m2:klIC",
        "natuerlich": "natu:6lIC",
        "natürlich": "natu:6lIC",
        "eigentlich": "aig@ntlIC",
        "schoen": "S2:n",
        "schön": "S2:n",
        "koennen": "k9n@n",
        "können": "k9n@n",
        "koennte": "k9nt@",
        "könnte": "k9nt@",
        "woerter": "v9rt6",
        "wörter": "v9rt6",
        "fuer": "fy:6",
        "tuer": "ty:6",
        "tür": "ty:6",
        "uebung": "y:bUN",
        "übung": "y:bUN",
        "oel": "2:l",
        "öl": "2:l",
        "zwoelf": "tsv9lf",
        "zwölf": "tsv9lf",
        "fuenf": "fYnf",
        "fünf": "fYnf",
        "vier": "fi:6",
        "vierzehn": "fI6tse:n",
        "vierzig": "fI6tsIC",
        "acht": "axt",
        "achtzig": "axtsIC",
        "zwei": "tsvai",
        "drei": "drai",
        "eins": "ains",
        "sieben": "zi:b@n",
        "neun": "nOYn",
        "zehn": "tse:n",
        "hundert": "hUnd6t",
        "tausend": "tauz@nt",
        "und": "Unt",
        "ja": "ja:",
        "nein": "nain",
        "bitte": "bIt@",
        "danke": "daNk@",
        "hallo": "halo:",
        "plus": "plUs",
        "minus": "mi:nUs",
        "via": "vi:a",
        "ok": "o:ke:",
        "okay": "o:ke:",
    }
    for w, p in pairs.items():
        _lex(w, p)


_boot_lexicon()


# ---------------------------------------------------------------------------
# Normalization
# ---------------------------------------------------------------------------

_UMLAUT_COMBINING = {
    "a\u0308": "ä",
    "o\u0308": "ö",
    "u\u0308": "ü",
    "A\u0308": "Ä",
    "O\u0308": "Ö",
    "U\u0308": "Ü",
}

_DIGIT_NAMES = {
    "0": "nUl",
    "1": "ains",
    "2": "tsvai",
    "3": "drai",
    "4": "fi:6",
    "5": "fYnf",
    "6": "zEks",
    "7": "zi:b@n",
    "8": "axt",
    "9": "nOYn",
}


def normalize_word(word: str) -> str:
    w = unicodedata.normalize("NFKC", word)
    for a, b in _UMLAUT_COMBINING.items():
        w = w.replace(a, b)
    w = w.replace("ß", "ss")
    return w.strip().lower()


# ---------------------------------------------------------------------------
# Rule engine
# ---------------------------------------------------------------------------

_FRONT = frozenset("eiäöüylnrEI")  # triggers ich-Laut for ch
_BACK_VOWEL = frozenset("aouauAOU")


def _is_vowel_letter(ch: str) -> bool:
    return ch.lower() in "aeiouäöüy"


def _consonant_run_len(s: str, i: int) -> int:
    n = 0
    while i + n < len(s) and not _is_vowel_letter(s[i + n]) and s[i + n] != "-":
        n += 1
    return n


def _vowel_should_be_long(word: str, i: int, grapheme_len: int) -> bool:
    """Rough native-German length: open syllable / single following C / h."""
    j = i + grapheme_len
    if j < len(word) and word[j] == "h" and (j + 1 == len(word) or not _is_vowel_letter(word[j + 1])):
        return True
    run = _consonant_run_len(word, j)
    if run == 0:
        return True
    if run == 1:
        # one C then vowel or end → often long (geben, Tag)
        if j + 1 >= len(word) or _is_vowel_letter(word[j + 1]):
            return True
        return j + 1 >= len(word)
    return False


def _apply_final_devoicing(phones: list[str]) -> list[str]:
    if not phones:
        return phones
    table = {"b": "p", "d": "t", "g": "k", "v": "f", "z": "s", "Z": "S"}
    last = phones[-1]
    if last in table:
        phones[-1] = table[last]
    return phones


def g2p_word_rules(word: str) -> list[str]:
    """Letter-to-sound for a single normalized German word."""
    w = word
    n = len(w)
    i = 0
    out: list[str] = []

    def peek(k: int = 0) -> str:
        j = i + k
        return w[j] if 0 <= j < n else ""

    def starts(prefix: str) -> bool:
        return w.startswith(prefix, i)

    while i < n:
        ch = w[i]
        nxt = peek(1)
        prev = w[i - 1] if i else ""

        # --- multi-letter, longest first ---
        if starts("tsch"):
            out.append("tS")
            i += 4
            continue
        if starts("dsch"):
            out.append("dZ")
            i += 4
            continue
        if starts("sch"):
            out.append("S")
            i += 3
            continue
        if starts("chs"):
            out.append("k")
            out.append("s")
            i += 3
            continue
        if starts("ck"):
            out.append("k")
            i += 2
            continue
        if starts("tz"):
            out.append("ts")
            i += 2
            continue
        if starts("dt"):
            out.append("t")
            i += 2
            continue
        if starts("ph"):
            out.append("f")
            i += 2
            continue
        if starts("qu"):
            out.append("k")
            out.append("v")
            i += 2
            continue
        if starts("ng"):
            out.append("N")
            i += 2
            continue
        if starts("nk"):
            out.append("N")
            out.append("k")
            i += 2
            continue
        if starts("pf"):
            out.append("pf")
            i += 2
            continue

        # diphthongs
        if starts("eu") or starts("äu") or starts("aeu"):
            out.append("oy")
            i += 2 if not starts("aeu") else 3
            continue
        if starts("ai") or starts("ei") or starts("ay") or starts("ey"):
            out.append("ai")
            i += 2
            continue
        if starts("au"):
            out.append("au")
            i += 2
            continue
        if starts("ie"):
            out.append("i:")
            i += 2
            if peek(0) == "h":
                i += 1
            continue

        # ch
        if starts("ch"):
            left = prev.lower()
            if left in "aou" or (i >= 2 and w[i - 2 : i] == "au"):
                out.append("x")
            else:
                out.append("C")
            i += 2
            continue

        # dehnungs-h after vowel letter already consumed — handle with vowels
        # doubled consonants → single
        if ch == nxt and ch in "bcdfklmnpqrstvwxz":
            mapping = {
                "b": "b",
                "c": "k",
                "d": "d",
                "f": "f",
                "k": "k",
                "l": "l",
                "m": "m",
                "n": "n",
                "p": "p",
                "q": "k",
                "r": "r",
                "s": "s",
                "t": "t",
                "v": "f",
                "w": "v",
                "x": "ks",
                "z": "ts",
            }
            phone = mapping[ch]
            if phone == "ks":
                out.extend(["k", "s"])
            else:
                out.append(phone)
            i += 2
            continue

        # --- vowels ---
        if ch in "äöüaeiouy":
            # vowel + h (Dehnung)
            stretch = nxt == "h" and (i + 2 >= n or not _is_vowel_letter(w[i + 2]))
            doubled = nxt == ch and ch in "aeiou"
            long = stretch or doubled or _vowel_should_be_long(w, i, 1)

            if ch == "ä":
                out.append("E:" if long else "E")
            elif ch == "ö":
                out.append("2:" if long else "9")
            elif ch == "ü":
                out.append("y:" if long else "Y")
            elif ch == "a":
                out.append("a:" if long else "a")
            elif ch == "e":
                # unstressed ending e / en / el / er
                rest = w[i:]
                if rest == "e":
                    out.append("@")
                elif rest == "er":
                    out.append("6")
                    i = n
                    continue
                elif rest.startswith("er") and (len(rest) == 2 or not _is_vowel_letter(rest[2])):
                    # -er-, -ern
                    out.append("6")
                    i += 2
                    continue
                elif rest.startswith("en") and (len(rest) == 2 or not _is_vowel_letter(rest[2])):
                    out.append("@")
                    out.append("n")
                    i += 2
                    continue
                elif rest.startswith("el") and (len(rest) == 2 or not _is_vowel_letter(rest[2])):
                    out.append("@")
                    out.append("l")
                    i += 2
                    continue
                elif i > 0 and not long:
                    out.append("@" if i >= n - 2 else "E")
                else:
                    out.append("e:" if long else "E")
            elif ch == "i":
                out.append("i:" if long else "I")
            elif ch == "o":
                out.append("o:" if long else "O")
            elif ch == "u":
                out.append("u:" if long else "U")
            elif ch == "y":
                out.append("y:" if long else "Y")

            i += 1
            if stretch or doubled:
                i += 1
            continue

        # --- single consonants ---
        if ch == "c":
            if nxt in "eiäöüy":
                out.append("ts")
            else:
                out.append("k")
            i += 1
            continue
        if ch == "s":
            if nxt in "pt" and (i == 0 or prev in "-"):
                out.append("S")
                i += 1
                continue
            # s + vowel often z at onset or intervocalic
            if i == 0 and _is_vowel_letter(nxt):
                out.append("z")
            elif _is_vowel_letter(prev) and _is_vowel_letter(nxt):
                out.append("z")
            else:
                out.append("s")
            i += 1
            continue
        if ch == "v":
            out.append("f")  # native default; loanwords live in lexicon
            i += 1
            continue
        if ch == "w":
            out.append("v")
            i += 1
            continue
        if ch == "z":
            out.append("ts")
            i += 1
            continue
        if ch == "x":
            out.extend(["k", "s"])
            i += 1
            continue
        if ch == "q":
            out.append("k")
            i += 1
            continue
        if ch == "j":
            out.append("j")
            i += 1
            continue
        if ch == "g":
            # -ig
            if prev == "i" and (i + 1 == n or w[i + 1] in "tk"):
                if out and out[-1] in ("I", "i:"):
                    out[-1] = "I"
                out.append("C")
                i += 1
                continue
            out.append("g")
            i += 1
            continue
        if ch == "h":
            # onset h; otherwise already consumed as Dehnung
            if i == 0 or _is_vowel_letter(nxt) and not _is_vowel_letter(prev):
                out.append("h")
            i += 1
            continue
        if ch == "-":
            i += 1
            continue
        simple = {
            "b": "b",
            "d": "d",
            "f": "f",
            "k": "k",
            "l": "l",
            "m": "m",
            "n": "n",
            "p": "p",
            "r": "r",
            "t": "t",
        }
        if ch in simple:
            out.append(simple[ch])
            i += 1
            continue

        # unknown char: skip letters we cannot map; keep nothing
        i += 1

    return _apply_final_devoicing(out)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_WORD_RE = re.compile(
    r"⟦U\d+⟧|[A-Za-zÄÖÜäöüß]+|\d+|[^\sA-Za-zÄÖÜäöüß\d⟦⟧]+",
    re.UNICODE,
)
_STRUCT_RE = re.compile(
    r"https?://\S+|www\.\S+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"
    r"|`[^`]+`|\b\d+(?:[.,]\d+)*\b|\b[A-Z]{2,}[A-Z0-9_]*\b"
)
_U_TOKEN_RE = re.compile(r"^⟦U(\d+)⟧$")


def g2p_word(word: str) -> G2PWord:
    raw = word
    if _U_TOKEN_RE.fullmatch(raw):
        return G2PWord(raw, tuple(), "passthrough")
    if re.fullmatch(r"\d+", raw):
        phones: list[str] = []
        for d in raw:
            phones.extend(PHONE_RE.findall(_DIGIT_NAMES[d]))
        return G2PWord(raw, tuple(phones), "passthrough")
    if not re.search(r"[A-Za-zÄÖÜäöüß]", raw):
        return G2PWord(raw, tuple(), "passthrough")

    key = normalize_word(raw)
    if key in LEXICON:
        return G2PWord(raw, LEXICON[key], "lex")
    phones = tuple(g2p_word_rules(key))
    return G2PWord(raw, phones, "rules")


def g2p_text(text: str) -> list[G2PWord]:
    return [g2p_word(tok) for tok in _WORD_RE.findall(text)]


def render_samsa(words: Iterable[G2PWord], word_sep: str = " | ") -> str:
    chunks = []
    for w in words:
        if w.source == "passthrough" and not w.phones:
            chunks.append(w.word)
        else:
            chunks.append(w.samsa() or w.word)
    return word_sep.join(chunks)


def extract_u(text: str) -> tuple[str, list[str]]:
    """Pull structure tokens; replace with §i placeholders."""
    found: list[str] = []

    def repl(m: re.Match[str]) -> str:
        found.append(m.group(0))
        return f" ⟦U{len(found) - 1}⟧ "

    return _STRUCT_RE.sub(repl, text), found


def restore_u(text: str, found: list[str]) -> str:
    def repl(m: re.Match[str]) -> str:
        i = int(m.group(1))
        return found[i] if 0 <= i < len(found) else m.group(0)

    return re.sub(r"⟦U(\d+)⟧", repl, text)


def g2p(text: str, *, protect_u: bool = True) -> tuple[list[G2PWord], list[str]]:
    u: list[str] = []
    body = text
    if protect_u:
        body, u = extract_u(text)
    return g2p_text(body), u


def main() -> None:
    p = argparse.ArgumentParser(description="German G2P → ASCII phones")
    p.add_argument("text", nargs="*", help="input text")
    p.add_argument("--no-u", action="store_true")
    args = p.parse_args()
    text = " ".join(args.text) if args.text else ""
    if not text:
        text = "Die neue Hybrid Architektur wurde als ein System entworfen."
    words, u = g2p(text, protect_u=not args.no_u)
    print(render_samsa(words))
    for w in words:
        if w.phones:
            print(f"  {w.word:20s} {w.source:11s} {w.samsa()}")
    if u:
        print("U:", u)


if __name__ == "__main__":
    main()
