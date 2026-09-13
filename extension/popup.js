const KEY = "pholine.enabled";
const LANG_KEY = "pholine.lang";
const STAT_KEY = "pholine.stats";
const SESSION_KEY = "pholine.session";

function fmt(n) {
  return String(n);
}

function ago(ts) {
  if (!ts) return "";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "gerade eben";
  if (s < 60) return "vor " + s + "s";
  if (s < 3600) return "vor " + Math.round(s / 60) + " min";
  return "vor " + Math.round(s / 3600) + " h";
}

chrome.storage.local.get(
  {
    [KEY]: true,
    [LANG_KEY]: "de",
    [STAT_KEY]: [],
    [SESSION_KEY]: { n: 0, saved: 0, fromTokens: 0, toTokens: 0 },
    "pholine.seen": null,
    "pholine.hook": null,
    "pholine.composer": null,
  },
  (s) => {
    document.getElementById("on").checked = s[KEY];
    document.getElementById("lang").value = s[LANG_KEY];
    const el = document.getElementById("stat");
    const last = Array.isArray(s[STAT_KEY]) ? s[STAT_KEY][0] : null;
    const sess = s[SESSION_KEY] || {};
    const seen = s["pholine.seen"];
    const hook = s["pholine.hook"];
    const composer = s["pholine.composer"];

    if (last && typeof last.fromTokens === "number") {
      el.classList.remove("empty");
      const sign = last.pct > 0 ? "−" : last.pct < 0 ? "+" : "";
      const lines = [
        "Letzte Anfrage  " + last.fromTokens + " → " + last.toTokens + " Tokens",
        "Ersparnis       " + sign + Math.abs(last.pct) + " %  (" + (last.saved >= 0 ? "−" : "+") + Math.abs(last.saved) + ")",
      ];
      if (last.protocolTokens) lines.push("Protokoll einmalig +" + last.protocolTokens);
      if (last.url) lines.push(String(last.url).slice(0, 72));
      if (sess.n) {
        lines.push("");
        lines.push("Session " + sess.n + " Anfragen");
        lines.push(fmt(sess.fromTokens) + " → " + fmt(sess.toTokens) + "  gespart " + fmt(sess.saved));
      }
      el.textContent = lines.join("\n");
    } else if (seen && seen.url) {
      el.classList.remove("empty");
      el.textContent =
        "Hook sieht Requests " + ago(seen.at) + ".\n" +
        String(seen.url).slice(0, 90) +
        (seen.rewritten ? "\numgeschrieben" : "\nnoch kein User-Text im Payload") +
        (seen.note ? "\n" + seen.note : "");
    } else if (composer && composer.text) {
      el.classList.remove("empty");
      el.textContent =
        "Composer gesehen " + ago(composer.at) + " auf " + (composer.host || "") + ".\n" +
        composer.text.slice(0, 120) +
        "\nRequest noch nicht abgefangen — Tab hart neu laden, dann nochmal senden.";
    } else if (hook && hook.at) {
      el.classList.remove("empty");
      el.textContent =
        "Hook live (" + (hook.version || "?") + ") auf " + (hook.host || "") + " " + ago(hook.at) + ".\n" +
        "Noch keine Anfrage. Im Chat-Tab senden, Popup danach erneut öffnen.";
    } else if (last && last.fromWords) {
      el.textContent =
        "Letzte Anfrage " + last.fromWords + " → " + last.toWords + " Wörter. Extension neu laden für Token-Zählung.";
    }
  },
);

document.getElementById("on").addEventListener("change", (e) => {
  chrome.storage.local.set({ [KEY]: e.target.checked });
});
document.getElementById("lang").addEventListener("change", (e) => {
  chrome.storage.local.set({ [LANG_KEY]: e.target.value });
});
