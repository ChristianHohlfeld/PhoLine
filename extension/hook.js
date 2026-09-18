/* MAIN world — install fetch/XHR/WebSocket hooks once after load + delay. */
(function () {
  "use strict";

  const VERSION = "1.4.1";
  const MAX_BODY = 48000;
  const INSTALL_DELAY_MS = 1500;

  const Pho = () => globalThis.PhoLine;

  let cfg = { enabled: true, inject: true, primed: false };
  let installed = false;

  function post(payload) {
    try {
      window.postMessage(
        Object.assign({ at: Date.now(), version: VERSION }, payload),
        "*",
      );
    } catch {
      /* ignore */
    }
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data) return;
    if (e.data.type === "PHOLINE_CFG") {
      cfg.enabled = e.data.enabled !== false;
      cfg.inject = e.data.inject !== false;
    }
    if (e.data.type === "PHOLINE_HELLO") {
      post({ type: "PHOLINE_READY", version: VERSION });
    }
  });

  function shouldWatch(url, method) {
    const api = Pho();
    if (!api || !cfg.enabled) return false;
    const m = String(method || "GET").toUpperCase();
    if (m !== "POST" && m !== "PUT" && m !== "PATCH") return false;
    if (api.isAssetUrl && api.isAssetUrl(url)) return false;
    return !!(api.isChatUrl && api.isChatUrl(url));
  }

  function tooBig(n) {
    return typeof n === "number" && n > MAX_BODY;
  }

  function contentLengthOf(headersLike) {
    try {
      if (!headersLike) return 0;
      const h = headersLike instanceof Headers ? headersLike : new Headers(headersLike);
      return parseInt(h.get("content-length") || "0", 10) || 0;
    } catch {
      return 0;
    }
  }

  async function readBody(body) {
    if (body == null) return null;
    if (typeof body === "string") {
      if (body.length > MAX_BODY) return null;
      return { text: body, kind: "string" };
    }
    if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
      const text = body.toString();
      if (text.length > MAX_BODY) return null;
      return { text, kind: "params" };
    }
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      const entries = [];
      for (const [k, v] of body.entries()) {
        if (typeof v !== "string") return null;
        entries.push([k, v]);
      }
      const text = new URLSearchParams(entries).toString();
      if (text.length > MAX_BODY) return null;
      return { text, kind: "form", entries };
    }
    if (typeof Blob !== "undefined" && body instanceof Blob) {
      if (tooBig(body.size)) return null;
      const text = await body.text();
      if (text.length > MAX_BODY) return null;
      return { text, kind: "blob", type: body.type };
    }
    if (body instanceof ArrayBuffer) {
      if (tooBig(body.byteLength)) return null;
      return { text: new TextDecoder().decode(body), kind: "buffer" };
    }
    if (ArrayBuffer.isView(body)) {
      if (tooBig(body.byteLength)) return null;
      return {
        text: new TextDecoder().decode(body),
        kind: "view",
      };
    }
    if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) {
      const text = await new Response(body).text();
      if (text.length > MAX_BODY) return null;
      return { text, kind: "stream" };
    }
    return null;
  }

  function encodeBody(text, packed) {
    const kind = packed.kind;
    if (kind === "buffer" || kind === "view") return new TextEncoder().encode(text);
    if (kind === "blob") return new Blob([text], { type: packed.type || "application/json" });
    if (kind === "params") return text;
    if (kind === "form") {
      const fd = new FormData();
      const params = new URLSearchParams(text);
      for (const [k, v] of params.entries()) fd.append(k, v);
      return fd;
    }
    return text;
  }

  function rewriteText(text, url) {
    const api = Pho();
    if (!api || !cfg.enabled) return null;
    if (typeof text !== "string" || !text) return null;
    if (text.length > MAX_BODY) return null;
    if (api.looksLikeChatPayload && !api.looksLikeChatPayload(text)) return null;

    const result = api.rewriteRequestBody(text, url, {
      primed: cfg.primed,
      injectProtocol: cfg.inject,
    });
    if (!result.changed) return null;

    cfg.primed = result.primed;
    const last = result.rewrites[result.rewrites.length - 1];
    if (last) {
      post({
        type: "PHOLINE_STAT",
        from: last.from,
        to: last.to,
        count: result.rewrites.length,
        url: String(url || ""),
      });
    }
    return result.body;
  }

  let origFetch = window.fetch.bind(window);

  async function hookedFetch(input, init) {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      const method = String(
        (init && init.method) || (input instanceof Request && input.method) || "GET",
      ).toUpperCase();

      if (shouldWatch(url, method)) {
        const cl =
          contentLengthOf(init && init.headers) ||
          (input instanceof Request ? contentLengthOf(input.headers) : 0);

        if (!tooBig(cl)) {
          let packed = null;
          if (init && init.body != null) packed = await readBody(init.body);
          else if (input instanceof Request) {
            const buf = await input.clone().arrayBuffer();
            packed = await readBody(buf);
          }

          if (packed && packed.text) {
            const next = rewriteText(packed.text, url);
            if (next != null) {
              const body = encodeBody(next, packed);
              if (init && init.body != null) {
                const headers = new Headers(init.headers || undefined);
                headers.delete("content-length");
                init = Object.assign({}, init, { body, headers });
              } else if (input instanceof Request) {
                const headers = new Headers(input.headers);
                headers.delete("content-length");
                const built = {
                  method: input.method,
                  headers,
                  body,
                  credentials: input.credentials,
                  cache: input.cache,
                  redirect: input.redirect,
                  referrer: input.referrer,
                  integrity: input.integrity,
                  mode: input.mode,
                };
                try {
                  input = new Request(url, built);
                } catch {
                  built.duplex = "half";
                  input = new Request(url, built);
                }
                init = undefined;
              }
            }
          }
        }
      }
    } catch {
      /* never block the page */
    }
    if (init === undefined) return origFetch(input);
    return origFetch(input, init);
  }

  const OrigXhrOpen = XMLHttpRequest.prototype.open;
  const OrigXhrSend = XMLHttpRequest.prototype.send;

  function hookedXhrOpen(method, url) {
    this.__phoUrl = url;
    this.__phoMethod = method;
    return OrigXhrOpen.apply(this, arguments);
  }

  function hookedXhrSend(body) {
    try {
      const url = String(this.__phoUrl || location.href);
      const method = String(this.__phoMethod || "POST");
      if (shouldWatch(url, method)) {
        if (typeof body === "string") {
          const next = rewriteText(body, url);
          if (next != null) body = next;
        } else if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
          if (!tooBig(body.byteLength)) {
            const text = new TextDecoder().decode(body);
            const next = rewriteText(text, url);
            if (next != null) body = new TextEncoder().encode(next);
          }
        }
        /* Blob XHR body: skip (sync path cannot await) */
      }
    } catch {
      /* ignore */
    }
    return OrigXhrSend.call(this, body);
  }

  const OrigWsSend = WebSocket.prototype.send;

  function hookedWsSend(data) {
    try {
      const url = this.url || location.href;
      if (shouldWatch(url, "POST")) {
        if (typeof data === "string") {
          if (data.length <= MAX_BODY) {
            const next = rewriteText(data, url);
            if (next != null) data = next;
          }
        } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
          if (!tooBig(data.byteLength)) {
            const text = new TextDecoder().decode(data);
            const next = rewriteText(text, url);
            if (next != null) data = new TextEncoder().encode(next);
          }
        }
      }
    } catch {
      /* ignore */
    }
    return OrigWsSend.call(this, data);
  }

  function install() {
    if (installed) return;
    installed = true;

    if (!window.fetch.__pholine) {
      origFetch = window.fetch.bind(window);
      hookedFetch.__pholine = true;
      window.fetch = hookedFetch;
    }

    XMLHttpRequest.prototype.open = hookedXhrOpen;
    XMLHttpRequest.prototype.send = hookedXhrSend;
    WebSocket.prototype.send = hookedWsSend;

    post({ type: "PHOLINE_READY", version: VERSION });
  }

  function arm() {
    setTimeout(install, INSTALL_DELAY_MS);
  }

  if (document.readyState === "complete") arm();
  else window.addEventListener("load", arm, { once: true });
})();
