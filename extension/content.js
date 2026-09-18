/* ISOLATED world — config bridge, HUD, deferred one-shot decode. */
(async function () {
  "use strict";

  const KEY = "pholine.enabled";
  const LANG_KEY = "pholine.lang";
  const STAT_KEY = "pholine.stats";
  const SESSION_KEY = "pholine.session";

  const MAX_TEXT_NODES = 2000;
  const MAX_PARENTS = 8;
  /** One-shot decode delays after PHOLINE_STAT (ms). No long-lived observer. */
  const DECODE_PASSES = [200, 500, 1000, 1500, 2200];

  /** Word-ish token estimate (no gpt-tokenizer). */
  function countTokens(text) {
    const t = String(text || "").trim();
    if (!t) return 0;
    let n = 0;
    for (const w of t.split(/\s+/)) {
      if (!w) continue;
      n += Math.max(1, Math.ceil([...w].length / 4));
    }
    return n;
  }

  function splitPayload(to) {
    const s = String(to || "");
    const mark = s.lastIndexOf("¶");
    if (mark < 0) return { protocol: "", wire: s.trim() };
    return { protocol: s.slice(0, mark).trim(), wire: s.slice(mark).trim() };
  }

  function ensureHud() {
    let n = document.getElementById("pholine-hud");
    if (n) return n;
    n = document.createElement("div");
    n.id = "pholine-hud";
    n.style.cssText =
      "position:fixed;z-index:2147483647;right:12px;bottom:12px;max-width:260px;" +
      "background:#141413;color:#eceae4;border:1px solid rgba(236,234,228,.14);" +
      "padding:6px 9px;font:12px/1.3 ui-sans-serif,system-ui;border-radius:10px;" +
      "box-shadow:0 8px 20px rgba(0,0,0,.28);opacity:.78";
    (document.documentElement || document.body).appendChild(n);
    return n;
  }

  function setIdleHud() {
    const n = ensureHud();
    n.replaceChildren();
    n.style.padding = "6px 9px";
    n.style.opacity = "0.78";
    const row = document.createElement("div");
    row.style.cssText = "display:flex;align-items:baseline;gap:8px;white-space:nowrap";
    const mark = document.createElement("span");
    mark.style.cssText =
      "font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9c9a93";
    mark.textContent = "PhoLine";
    const title = document.createElement("span");
    title.style.cssText = "font-size:12px;font-weight:600;color:#8fa382";
    title.textContent = "bereit";
    row.append(mark, title);
    n.appendChild(row);
  }

  function setStatHud(title, lines) {
    const n = ensureHud();
    n.replaceChildren();
    n.style.padding = "8px 10px";
    n.style.opacity = "0.92";
    const kicker = document.createElement("div");
    kicker.style.cssText =
      "font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#9c9a93;margin-bottom:4px";
    kicker.textContent = "PhoLine";
    const big = document.createElement("div");
    big.style.cssText =
      "font-size:20px;font-weight:650;letter-spacing:-.03em;line-height:1.1;color:#8fa382";
    big.textContent = title;
    n.append(kicker, big);
    for (const line of lines || []) {
      const p = document.createElement("div");
      p.style.cssText =
        "margin-top:4px;font:11px/1.35 ui-monospace,Menlo,monospace;color:#eceae4";
      p.textContent = line;
      n.appendChild(p);
    }
  }

  async function pushCfg() {
    const s = await chrome.storage.local.get({ [KEY]: true, [LANG_KEY]: "de" });
    window.postMessage(
      { type: "PHOLINE_CFG", enabled: s[KEY] !== false, inject: true },
      "*",
    );
    window.postMessage({ type: "PHOLINE_HELLO" }, "*");
    return s;
  }

  let decoding = false;
  const pendingDecodeTimers = [];

  function skipSubtree(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.id === "pholine-hud") return true;
    const tag = el.tagName;
    if (tag === "TEXTAREA" || tag === "INPUT" || tag === "SCRIPT" || tag === "STYLE")
      return true;
    if (el.isContentEditable || el.getAttribute("contenteditable") === "true") return true;
    return false;
  }

  /**
   * Bounded ¶ decode: TreeWalker with early exit (max text nodes / ¶ parents).
   * Never reads document.body.innerText (full-page serialization).
   */
  function decodeTree() {
    if (decoding || !document.body || !globalThis.PhoLine) return;
    decoding = true;
    try {
      chrome.storage.local.get({ [LANG_KEY]: "de" }, (cfg) => {
        try {
          const lang = cfg[LANG_KEY] === "en" ? "en" : "de";
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode(node) {
                const p = node.parentElement;
                if (!p) return NodeFilter.FILTER_REJECT;
                if (p.closest("#pholine-hud, textarea, input, [contenteditable='true']"))
                  return NodeFilter.FILTER_REJECT;
                if (skipSubtree(p)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
              },
            },
          );

          const parents = [];
          const seen = new Set();
          let scanned = 0;
          while (walker.nextNode()) {
            scanned++;
            if (scanned > MAX_TEXT_NODES) break;
            const node = walker.currentNode;
            const v = node.nodeValue || "";
            if (!v.includes("¶")) continue;
            const p = node.parentElement;
            if (!p || p.dataset.phoDone || seen.has(p)) continue;
            if (p.closest("#pholine-hud, textarea, input, [contenteditable='true']")) continue;
            seen.add(p);
            parents.push(p);
            if (parents.length >= MAX_PARENTS) break;
          }

          for (const p of parents) {
            // Element-local text only — never document.body.innerText.
            const full = (p.textContent || "").trim();
            if (!PhoLine.isPhoLine(full)) continue;
            p.dataset.phoDone = "1";
            p.title = "abgerechnet ≈ " + countTokens(full) + " · " + full;
            p.textContent = PhoLine.decode(full, lang);
          }
        } finally {
          decoding = false;
        }
      });
    } catch {
      decoding = false;
    }
  }

  /** After a send: a few one-shot passes, then stop. No MutationObserver. */
  function scheduleDecodePasses() {
    for (const t of pendingDecodeTimers) clearTimeout(t);
    pendingDecodeTimers.length = 0;
    for (const ms of DECODE_PASSES) {
      pendingDecodeTimers.push(setTimeout(decodeTree, ms));
    }
  }

  window.addEventListener("message", async (e) => {
    if (e.source !== window || !e.data) return;

    if (e.data.type === "PHOLINE_READY") {
      await chrome.storage.local.set({
        "pholine.hook": {
          version: e.data.version || "1.4.1",
          at: Date.now(),
          host: location.host,
        },
      });
      return;
    }

    if (e.data.type !== "PHOLINE_STAT") return;

    scheduleDecodePasses();

    const from = String(e.data.from || "");
    const to = String(e.data.to || "");
    const { protocol, wire } = splitPayload(to);
    const fromTokens = countTokens(from);
    const toTokens = countTokens(wire);
    const protocolTokens = protocol ? countTokens(protocol) : 0;
    const saved = fromTokens - toTokens;
    const pct = fromTokens ? Math.round((1 - toTokens / fromTokens) * 100) : 0;
    const clip = (s, n = 8000) => {
      s = String(s || "");
      return s.length > n ? s.slice(0, n) + "…" : s;
    };

    const rec = {
      at: Date.now(),
      fromTokens,
      toTokens,
      protocolTokens,
      saved,
      pct,
      encoding: "estimate",
      url: String(e.data.url || ""),
      fromText: clip(from),
      toText: clip(wire),
      toFull: clip(to),
    };

    const prev = await chrome.storage.local.get({
      [STAT_KEY]: [],
      [SESSION_KEY]: { n: 0, fromTokens: 0, toTokens: 0, saved: 0 },
    });
    const list = Array.isArray(prev[STAT_KEY]) ? prev[STAT_KEY] : [];
    list.unshift(rec);
    const sess =
      prev[SESSION_KEY] && typeof prev[SESSION_KEY] === "object"
        ? prev[SESSION_KEY]
        : { n: 0, fromTokens: 0, toTokens: 0, saved: 0 };
    sess.n = (sess.n || 0) + 1;
    sess.fromTokens = (sess.fromTokens || 0) + fromTokens;
    sess.toTokens = (sess.toTokens || 0) + toTokens;
    sess.saved = (sess.saved || 0) + saved;
    await chrome.storage.local.set({
      [STAT_KEY]: list.slice(0, 40),
      [SESSION_KEY]: sess,
    });

    const title = pct > 0 ? "−" + pct + " %" : pct < 0 ? "+" + Math.abs(pct) + " %" : "0 %";
    const lines = [
      fromTokens + " → " + toTokens + " (Schätzung)",
      saved > 0
        ? "gespart " + saved + "  ·  Session −" + sess.saved
        : "Session " + (sess.saved >= 0 ? "−" : "+") + Math.abs(sess.saved),
    ];
    if (protocolTokens) lines.push("Protokoll einmalig +" + protocolTokens);
    setStatHud(title, lines);
  });

  await pushCfg();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[KEY] || changes[LANG_KEY]) void pushCfg();
  });

  // No boot MutationObserver and no full-page innerText scan.
  // ¶ replies are decoded only after PHOLINE_STAT via deferred one-shots.

  setIdleHud();
})();
