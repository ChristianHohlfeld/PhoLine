PhoLine Chrome extension 1.4.0 (unpacked)
Copyright © 2026 Christian Heinrich Hohlfeld
ORCID: https://orcid.org/0009-0003-6634-9045

Boot-safe build: hooks install after window load + 1.5s, 48KB body cap,
strict chat endpoints only, no MutationObserver until a rewrite (or one 8s ¶ check).

1. Keep this folder together (manifest.json, pho.js, hook.js, content.js, popup.*).
2. Chrome → chrome://extensions → Developer mode on.
3. Load unpacked → select this folder. If already loaded: Remove, then load again.
4. Open ChatGPT / Grok / Claude / Gemini / x.com and hard-reload (Ctrl+Shift+R).
5. Type normally and send. HUD bottom-right shows „PhoLine · bereit“, then savings.

No count.js / tokenizer bundle is shipped — popup uses a word-ish estimate.
The composer is not rewritten. fetch / XHR / WebSocket bodies are.
