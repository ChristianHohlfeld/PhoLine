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

function savingsLine(last) {
  const sign = last.pct > 0 ? "−" : last.pct < 0 ? "+" : "";
  return (
    "Ersparnis       " +
    sign +
    Math.abs(last.pct) +
    " %  (" +
    (last.saved >= 0 ? "−" : "+") +
    Math.abs(last.saved) +
    ")"
  );
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
    const detail = document.getElementById("detail");
    const detailMeta = document.getElementById("detailMeta");
    const detailBody = document.getElementById("detailBody");
    const tabBefore = document.getElementById("tabBefore");
    const tabAfter = document.getElementById("tabAfter");
    const last = Array.isArray(s[STAT_KEY]) ? s[STAT_KEY][0] : null;
    const sess = s[SESSION_KEY] || {};
    const seen = s["pholine.seen"];
    const hook = s["pholine.hook"];
    const composer = s["pholine.composer"];

    let view = "before"; // before | after
    let open = false;

    function renderDetail() {
      if (!last) return;
      const before = last.fromText || "(kein Text gespeichert — einmal neu senden)";
      const after = last.toText || last.toFull || "(kein Text gespeichert — einmal neu senden)";
      if (view === "before") {
        tabBefore.classList.add("active");
        tabAfter.classList.remove("active");
        detailMeta.textContent =
          "Unbearbeitet · " +
          (typeof last.fromTokens === "number" ? last.fromTokens + " Tokens" : "?") +
          " · " +
          savingsLine(last).replace(/^Ersparnis\s+/, "Ersparnis ");
        detailBody.textContent = before;
      } else {
        tabAfter.classList.add("active");
        tabBefore.classList.remove("active");
        detailMeta.textContent =
          "Danach · " +
          (typeof last.toTokens === "number" ? last.toTokens + " Tokens" : "?") +
          " · " +
          savingsLine(last).replace(/^Ersparnis\s+/, "Ersparnis ");
        detailBody.textContent = after;
      }
    }

    function setOpen(next) {
      open = next;
      detail.classList.toggle("open", open);
      if (open) renderDetail();
    }

    if (last && typeof last.fromTokens === "number") {
      el.classList.remove("empty");
      el.classList.add("clickable");
      el.title = "Tippen: Vorher/Nachher anzeigen";
      const lines = [
        "Letzte Anfrage  " + last.fromTokens + " → " + last.toTokens + " Tokens  ▸",
        savingsLine(last),
      ];
      if (last.protocolTokens) lines.push("Protokoll einmalig +" + last.protocolTokens);
      if (last.url) lines.push(String(last.url).slice(0, 72));
      if (sess.n) {
        lines.push("");
        lines.push("Session " + sess.n + " Anfragen");
        lines.push(fmt(sess.fromTokens) + " → " + fmt(sess.toTokens) + "  gespart " + fmt(sess.saved));
      }
      lines.push("");
      lines.push("Tippen für Unbearbeitet ↔ Danach");
      el.textContent = lines.join("\n");

      el.addEventListener("click", () => {
        if (!open) {
          view = "before";
          setOpen(true);
        } else if (view === "before") {
          view = "after";
          renderDetail();
        } else {
          setOpen(false);
        }
      });
      tabBefore.addEventListener("click", (e) => {
        e.stopPropagation();
        view = "before";
        setOpen(true);
      });
      tabAfter.addEventListener("click", (e) => {
        e.stopPropagation();
        view = "after";
        setOpen(true);
      });
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
    } else if (last && (last.fromWords || last.fromTokens != null)) {
      el.classList.remove("empty");
      el.textContent =
        "Alte Statistik ohne Text/Token-API.\n" +
        "Extension entfernen → neu laden → Chat-Tab hart refreshen → einmal senden.";
    }
  },
);

document.getElementById("on").addEventListener("change", (e) => {
  chrome.storage.local.set({ [KEY]: e.target.checked });
});
document.getElementById("lang").addEventListener("change", (e) => {
  chrome.storage.local.set({ [LANG_KEY]: e.target.value });
});
