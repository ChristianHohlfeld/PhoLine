(async function () {
  const KEY = "pholine.enabled";
  const LANG_KEY = "pholine.lang";
  const STAT_KEY = "pholine.stats";

  function hud() {
    let n = document.getElementById("pholine-hud");
    if (n) return n;
    n = document.createElement("div");
    n.id = "pholine-hud";
    n.style.cssText =
      "position:fixed;z-index:2147483647;right:12px;bottom:12px;background:#141413;color:#eceae4;border:1px solid rgba(236,234,228,.14);padding:10px 12px;font:12px/1.4 ui-sans-serif,system-ui;border-radius:10px;max-width:280px;box-shadow:0 8px 24px rgba(0,0,0,.35)";
    document.documentElement.appendChild(n);
    return n;
  }

  function setHud(text) {
    const n = hud();
    n.textContent = text;
  }

  async function pushCfg() {
    const s = await chrome.storage.local.get({ [KEY]: true, [LANG_KEY]: "de" });
    window.postMessage(
      { type: "PHOLINE_CFG", enabled: s[KEY] !== false, inject: true },
      "*",
    );
    return s;
  }

  window.addEventListener("message", async (e) => {
    if (e.source !== window || !e.data || e.data.type !== "PHOLINE_STAT") return;
    const from = String(e.data.from || "");
    const to = String(e.data.to || "");
    const fromWords = from.trim().split(/\s+/).filter(Boolean).length;
    const toWords = to.replace(/^PhoLine[\s\S]*?\n\n/, "").trim().split(/\s+/).filter(Boolean).length;
    const pct = fromWords ? Math.round((1 - toWords / fromWords) * 100) : 0;
    const rec = {
      at: Date.now(),
      fromWords,
      toWords,
      pct,
    };
    const prev = await chrome.storage.local.get({ [STAT_KEY]: [] });
    const list = Array.isArray(prev[STAT_KEY]) ? prev[STAT_KEY] : [];
    list.unshift(rec);
    await chrome.storage.local.set({ [STAT_KEY]: list.slice(0, 40) });
    setHud(
      pct > 0
        ? `PhoLine · Anfrage ${fromWords} → ${toWords} Wörter (−${pct}%)`
        : `PhoLine · Anfrage gefiltert`,
    );
  });

  function decodeTree() {
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
        if (!PhoLine.isPhoLine(full)) continue;
        p.dataset.phoDone = "1";
        p.title = "billed: " + full;
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
  setHud("PhoLine · Kanal aktiv");
})();
