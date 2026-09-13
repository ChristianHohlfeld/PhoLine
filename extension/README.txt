PhoLine Chrome extension (unpacked)
Copyright © 2026 Christian Heinrich Hohlfeld
ORCID: https://orcid.org/0009-0003-6634-9045

1. Keep this folder together (manifest.json, pho.js, hook.js, content.js, popup.*).
2. Chrome → chrome://extensions → Developer mode on.
3. Load unpacked → select this folder.
4. Open ChatGPT, Grok, Claude, or Gemini.
5. Type normally. PhoLine rewrites the request body before it hits the tokenizer.
   Replies that start with ¶ are expanded in the page.

The model is unchanged. PhO is the filter. The tokenizer is only the pipe.
The plugin does not rewrite the composer — it patches fetch, XHR, and WebSocket.
