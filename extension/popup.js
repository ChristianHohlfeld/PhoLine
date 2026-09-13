const KEY = "pholine.enabled";
const LANG_KEY = "pholine.lang";
const STAT_KEY = "pholine.stats";

chrome.storage.local.get({ [KEY]: true, [LANG_KEY]: "de", [STAT_KEY]: [] }, (s) => {
  document.getElementById("on").checked = s[KEY];
  document.getElementById("lang").value = s[LANG_KEY];
  const last = Array.isArray(s[STAT_KEY]) ? s[STAT_KEY][0] : null;
  const el = document.getElementById("stat");
  if (last && last.fromWords) {
    el.textContent =
      "Letzte Anfrage " +
      last.fromWords +
      " → " +
      last.toWords +
      " Wörter" +
      (last.pct > 0 ? " (−" + last.pct + "%)" : "");
  }
});

document.getElementById("on").addEventListener("change", (e) => {
  chrome.storage.local.set({ [KEY]: e.target.checked });
});
document.getElementById("lang").addEventListener("change", (e) => {
  chrome.storage.local.set({ [LANG_KEY]: e.target.value });
});
