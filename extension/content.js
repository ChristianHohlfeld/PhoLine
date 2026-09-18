(async function () {
  const KEY = "pholine.enabled";
  const LANG_KEY = "pholine.lang";
  const STAT_KEY = "pholine.stats";
  const SESSION_KEY = "pholine.session";

  function countTokens(text) {
    const pho = globalThis.PhoLine;
    const api = globalThis.PhoLineCount;
    if (pho && typeof pho.countTokens === "function") return pho.countTokens(text || "");
    if (api && typeof api.countTokens === "function") return api.countTokens(text || "");
    // Last resort only — real o200k lives on PhoLine after pack.
    const t = String(text || "").trim();
    if (!t) return 0;
    return t.split(/\s+/).reduce((n, w) => n + Math.max(1, Math.ceil(w.length / 4)), 0);
  }

  function splitPayload(to) {
    const s = String(to || "");
    const mark = s.lastIndexOf("¶");
    if (mark < 0) return { protocol: "", wire: s.trim() };
    return { protocol: s.slice(0, mark).trim(), wire: s.slice(mark).trim() };
  }

  function hud() {
    let n = document.getElementById("pholine-hud");
    if (n) return n;
    n = document.createElement("div");
    n.id = "pholine-hud";
    n.style.cssText =
      "position:fixed;z-index:2147483647;right:12px;bottom:12px;max-width:240px;background:#141413;color:#eceae4;border:1px solid rgba(236,234,228,.14);padding:8px 10px;font:12px/1.3 ui-sans-serif,system-ui;border-radius:10px;box-shadow:0 8px 20px rgba(0,0,0,.28);opacity:.92";
    (document.documentElement || document.body).appendChild(n);
    return n;
  }

  function setHud(htmlTitle, lines, mode) {
    const n = hud();
    n.replaceChildren();
    const compact = mode === "idle" || mode === "compact";
    if (compact) {
      n.style.minWidth = "";
      n.style.padding = "6px 9px";
      n.style.opacity = "0.78";
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:baseline;gap:8px;white-space:nowrap";
      const mark = document.createElement("span");
      mark.style.cssText = "font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9c9a93";
      mark.textContent = "PhoLine";
      const title = document.createElement("span");
      title.style.cssText = "font-size:12px;font-weight:600;color:#8fa382";
      title.textContent = htmlTitle;
      row.appendChild(mark);
      row.appendChild(title);
      n.appendChild(row);
      return;
    }
    n.style.padding = "8px 10px";
    n.style.opacity = "0.92";
    const kicker = document.createElement("div");
    kicker.style.cssText = "font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#9c9a93;margin-bottom:4px";
    kicker.textContent = "PhoLine · o200k";
    n.appendChild(kicker);
    const big = document.createElement("div");
    big.style.cssText = "font-size:20px;font-weight:650;letter-spacing:-.03em;line-height:1.1;color:#8fa382";
    big.textContent = htmlTitle;
    n.appendChild(big);
    for (const line of lines || []) {
      const p = document.createElement("div");
      p.style.cssText = "margin-top:4px;font:11px/1.35 ui-monospace,Menlo,monospace;color:#eceae4";
      p.textContent = line;
      n.appendChild(p);
    }
  }

  function idleHud() {
    // Tiny pill only — no essay on the chat UI.
    setHud("bereit", [], "idle");
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

  function shortUrl(url) {
    try {
      const u = new URL(url, location.href);
      return u.host + u.pathname.slice(0, 56);
    } catch {
      return String(url).slice(0, 72);
    }
  }

  function grabComposer() {
    const nodes = document.querySelectorAll(
      '#prompt-textarea, textarea, [contenteditable="true"], [role="textbox"]',
    );
    let best = "";
    for (const n of nodes) {
      if (n.closest && n.closest("#pholine-hud")) continue;
      const t = (n.value || n.innerText || n.textContent || "").trim();
      if (t.length > best.length) best = t;
    }
    return best;
  }

  async function noteComposer(text, why) {
    if (!text || text.length < 2) return;
    await chrome.storage.local.set({
      "pholine.composer": { text: text.slice(0, 400), why, at: Date.now(), host: location.host },
    });
    setHud("Prompt gesehen", [location.host, why, text.slice(0, 80)]);
  }

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      const t = grabComposer();
      if (t) void noteComposer(t, "enter");
    },
    true,
  );
  window.addEventListener(
    "click",
    (e) => {
      const el = e.target && e.target.closest ? e.target.closest("button, [role='button']") : null;
      if (!el) return;
      const label = (el.getAttribute("aria-label") || el.getAttribute("data-testid") || el.textContent || "").toLowerCase();
      if (!/send|submit|senden|absenden|paper-airplane|composer-submit/.test(label) && el.getAttribute("data-testid") !== "send-button") {
        return;
      }
      const t = grabComposer();
      if (t) void noteComposer(t, "send");
    },
    true,
  );

  window.addEventListener("message", async (e) => {
    if (e.source !== window || !e.data) return;
    if (e.data.type === "PHOLINE_READY") {
      await chrome.storage.local.set({
        "pholine.hook": { version: e.data.version || "1.3.0", at: Date.now(), host: location.host },
      });
      return;
    }
    if (e.data.type === "PHOLINE_SEEN") {
      await chrome.storage.local.set({
        "pholine.seen": {
          url: String(e.data.url || ""),
          rewritten: !!e.data.rewritten,
          bytes: e.data.bytes || 0,
          note: String(e.data.note || ""),
          at: Date.now(),
          host: location.host,
        },
      });
      if (!e.data.rewritten) {
        setHud("Request gesehen", [
          shortUrl(e.data.url || ""),
          e.data.note === "no-user-text" ? "noch kein User-Text im Payload" : String(e.data.note || "nicht umgeschrieben"),
        ]);
      }
      return;
    }
    if (e.data.type !== "PHOLINE_STAT") return;
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
      encoding: "o200k",
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
    await chrome.storage.local.set({ [STAT_KEY]: list.slice(0, 40), [SESSION_KEY]: sess });

    const title = pct > 0 ? "−" + pct + " %" : pct < 0 ? "+" + Math.abs(pct) + " %" : "0 %";
    const lines = [
      fromTokens + " → " + toTokens + " Tokens",
      saved > 0
        ? "gespart " + saved + "  ·  Session −" + sess.saved
        : "Session " + (sess.saved >= 0 ? "−" : "+") + Math.abs(sess.saved),
    ];
    if (protocolTokens) lines.push("Protokoll einmalig +" + protocolTokens);
    setHud(title, lines);
    const big = document.getElementById("pholine-hud") && document.getElementById("pholine-hud").children[1];
    if (big && pct < 0) big.style.color = "#c9897a";
  });

  function decodeTree() {
    if (!document.body) return;
    chrome.storage.local.get({ [LANG_KEY]: "de" }, (cfg) => {
      const lang = cfg[LANG_KEY] === "en" ? "en" : "de";
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        const t = walker.currentNode;
        const v = t.nodeValue || "";
        if (!/¶/.test(v)) continue;
        const p = t.parentElement;
        if (!p || p.dataset.phoDone) continue;
        if (p.closest("#pholine-hud, #pholine-toast, textarea, [contenteditable='true']")) continue;
        nodes.push(p);
      }
      for (const p of nodes) {
        const full = (p.innerText || "").trim();
        if (!globalThis.PhoLine || !PhoLine.isPhoLine(full)) continue;
        p.dataset.phoDone = "1";
        const billed = countTokens(full);
        p.title = "abgerechnet: " + billed + " Tokens · " + full;
        p.textContent = PhoLine.decode(full, lang);
      }
    });
  }

  await pushCfg();
  chrome.storage.onChanged.addListener(() => {
    void pushCfg();
  });
  const obs = new MutationObserver(() => decodeTree());
  obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  decodeTree();
  idleHud();
})();
