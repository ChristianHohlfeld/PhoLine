/* MAIN world — patch fetch / XHR / WebSocket before the page's chat client boots. */
(function () {
  const VERSION = "1.3.3";
  const Pho = () => globalThis.PhoLine;
  let cfg = { enabled: true, inject: true, primed: false };
  const queue = [];
  const MAX_QUEUE = 48;

  function post(payload) {
    try {
      payload.at = payload.at || Date.now();
      payload.version = VERSION;
      queue.push(payload);
      if (queue.length > MAX_QUEUE) queue.shift();
      window.postMessage(payload, "*");
    } catch {
      /* ignore */
    }
  }

  function flush() {
    for (const p of queue) {
      try {
        window.postMessage(p, "*");
      } catch {
        /* ignore */
      }
    }
    window.postMessage({ type: "PHOLINE_READY", version: VERSION, queued: queue.length, at: Date.now() }, "*");
  }

  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data) return;
    if (e.data.type === "PHOLINE_CFG") {
      cfg.enabled = e.data.enabled !== false;
      cfg.inject = e.data.inject !== false;
    }
    if (e.data.type === "PHOLINE_HELLO") flush();
  });

  function notify(rewrites, url) {
    if (!rewrites || !rewrites.length) return;
    const last = rewrites[rewrites.length - 1];
    post({
      type: "PHOLINE_STAT",
      from: last.from,
      to: last.to,
      count: rewrites.length,
      url: String(url || ""),
    });
  }

  function seen(url, rewritten, bytes, note) {
    post({
      type: "PHOLINE_SEEN",
      url: String(url || ""),
      rewritten: !!rewritten,
      bytes: bytes || 0,
      note: note || "",
      at: Date.now(),
    });
  }

  function shouldWatch(url, method) {
    const api = Pho();
    if (!api || !cfg.enabled) return false;
    const m = String(method || "GET").toUpperCase();
    if (m === "GET" || m === "HEAD" || m === "OPTIONS") return false;
    if (api.isAssetUrl && api.isAssetUrl(url)) return false;
    if (api.isChatUrl(url)) return true;
    if (api.isChatHost && api.isChatHost(location.host)) return true;
    return false;
  }

  async function readBody(body) {
    if (body == null) return null;
    if (typeof body === "string") return { text: body, kind: "string" };
    if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
      return { text: body.toString(), kind: "params" };
    }
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      const entries = [];
      for (const [k, v] of body.entries()) {
        if (typeof v !== "string") return null;
        entries.push([k, v]);
      }
      return { text: new URLSearchParams(entries).toString(), kind: "form", entries };
    }
    if (typeof Blob !== "undefined" && body instanceof Blob) {
      return { text: await body.text(), kind: "blob", type: body.type };
    }
    if (body instanceof ArrayBuffer) {
      return { text: new TextDecoder().decode(body), kind: "buffer" };
    }
    if (ArrayBuffer.isView(body)) {
      return {
        text: new TextDecoder().decode(body),
        kind: "view",
        ctor: body.constructor && body.constructor.name,
      };
    }
    if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) {
      return { text: await new Response(body).text(), kind: "stream" };
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

  function rewriteText(text, url, forceSeen) {
    const api = Pho();
    if (!api || !cfg.enabled) {
      if (forceSeen) seen(url, false, (text || "").length, "disabled");
      return null;
    }
    if (typeof text !== "string" || !text) return null;
    const result = api.rewriteRequestBody(text, url, {
      primed: cfg.primed,
      injectProtocol: cfg.inject,
    });
    seen(url, result.changed, text.length, result.changed ? "rewritten" : "no-user-text");
    if (!result.changed) return null;
    cfg.primed = result.primed;
    notify(result.rewrites, url);
    return result.body;
  }

  async function rewritePacked(packed, url) {
    if (!packed || packed.text == null) return null;
    const next = rewriteText(packed.text, url, true);
    if (next == null && packed.kind !== "stream") return null;
    return encodeBody(next != null ? next : packed.text, packed);
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
        let packed = null;
        if (init && init.body != null) packed = await readBody(init.body);
        else if (input instanceof Request) packed = await readBody(await input.clone().arrayBuffer());
        if (packed && packed.text) {
          const body = await rewritePacked(packed, url);
          if (body != null) {
            if (init && init.body != null) {
              const headers = new Headers(init.headers || undefined);
              headers.delete("content-length");
              init = { ...init, body, headers };
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
        } else {
          seen(url, false, 0, packed ? "empty-body" : "no-body");
        }
      }
    } catch {
      /* never block the page */
    }
    if (init === undefined) return origFetch(input);
    return origFetch(input, init);
  }
  hookedFetch.__pholine = true;

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__phoUrl = url;
    this.__phoMethod = method;
    return origOpen.apply(this, arguments);
  };

  const origSend = XMLHttpRequest.prototype.send;
  function hookedXhrSend(body) {
    try {
      const url = String(this.__phoUrl || location.href);
      const method = String(this.__phoMethod || "POST");
      if (shouldWatch(url, method)) {
        if (typeof body === "string") {
          const next = rewriteText(body, url, true);
          if (next != null) body = next;
        } else if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
          const text = new TextDecoder().decode(body);
          const next = rewriteText(text, url, true);
          if (next != null) body = new TextEncoder().encode(next);
        } else if (typeof Blob !== "undefined" && body instanceof Blob) {
          /* sync XHR cannot await; skip blob */
          seen(url, false, body.size || 0, "xhr-blob");
        } else {
          seen(url, false, 0, "xhr-" + (body == null ? "empty" : typeof body));
        }
      }
    } catch {
      /* ignore */
    }
    return origSend.call(this, body);
  }
  hookedXhrSend.__pholine = true;

  const origWsSend = WebSocket.prototype.send;
  function hookedWsSend(data) {
    try {
      const url = this.url || location.href;
      if (typeof data === "string") {
        if (data.trim().startsWith("{") || data.trim().startsWith("[") || data.includes("input_chunks") || data.includes("f.req")) {
          const next = rewriteText(data, url, true);
          if (next != null) data = next;
        } else if (Pho() && (Pho().isChatUrl(url) || (Pho().isChatHost && Pho().isChatHost(location.host)))) {
          seen(url, false, data.length, "ws-nonjson");
        }
      } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
        const text = new TextDecoder().decode(data);
        if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
          const next = rewriteText(text, url, true);
          if (next != null) data = new TextEncoder().encode(next);
        } else {
          seen(url, false, text.length, "ws-binary");
        }
      }
    } catch {
      /* ignore */
    }
    return origWsSend.call(this, data);
  }
  hookedWsSend.__pholine = true;

  function install() {
    if (window.fetch !== hookedFetch) {
      if (!window.fetch.__pholine) origFetch = window.fetch.bind(window);
      window.fetch = hookedFetch;
    }
    if (XMLHttpRequest.prototype.send !== hookedXhrSend) {
      XMLHttpRequest.prototype.send = hookedXhrSend;
    }
    if (WebSocket.prototype.send !== hookedWsSend) {
      WebSocket.prototype.send = hookedWsSend;
    }
  }

  install();
  // Do NOT poll every 400ms — that burned CPU, especially with all_frames.
  // Re-install only on load milestones and a rare safety check.
  document.addEventListener("DOMContentLoaded", install, { once: true });
  window.addEventListener("load", install, { once: true });
  setInterval(() => {
    if (window.fetch !== hookedFetch || XMLHttpRequest.prototype.send !== hookedXhrSend || WebSocket.prototype.send !== hookedWsSend) {
      install();
    }
  }, 8000);
  post({ type: "PHOLINE_READY", version: VERSION, queued: 0 });
})();
