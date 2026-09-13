PhoLine Chrome extension 1.3.0 (unpacked)
Copyright © 2026 Christian Heinrich Hohlfeld
ORCID: https://orcid.org/0009-0003-6634-9045

1. Keep this folder together (manifest.json, pho.js, hook.js, content.js, popup.*).
2. Chrome → chrome://extensions → Developer mode on.
3. Load unpacked → select this folder. If already loaded: Remove, then load again.
4. Open ChatGPT / Grok / Claude / Gemini and hard-reload the tab (Ctrl+Shift+R).
5. Type normally and send. HUD bottom-right shows token savings.
   The composer is not rewritten. fetch / XHR / WebSocket bodies are.

If the popup still says nothing: the tab was loaded before the hook.
Hard-reload, send one more message, then open the popup again.

The model is unchanged. PhO is the filter. The tokenizer is only the pipe.
