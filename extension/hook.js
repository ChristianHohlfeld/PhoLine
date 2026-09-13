/* MAIN world — patch fetch / XHR / WebSocket before the page's chat client boots. */
(function () {
  const Pho = () => globalThis.PhoLine;
  let cfg = { enabled: true, inject: true, primed: false };

  window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || e.data.type !== "PHOLINE_CFG") return;
    cfg.enabled = e.data.enabled !== false;
    cfg.inject = e.data.inject !== false;
  });

  function notify(rewrites) {
    if (!rewrites || !rewrites.length) return;
    const last = rewrites[rewrites.length - 1];
    window.postMessage(
      {
        type: "PHOLINE_STAT",
        from: last.from,
        to: last.to,
        count: rewrites.length,
      },
      "*",
    );
  }

  function rewriteBody(body, url) {
    const api = Pho();
    if (!api || !cfg.enabled) return null;
    if (typeof body !== "string" || !body) return null;
    const result = api.rewriteRequestBody(body, url, {
      primed: cfg.primed,
      injectProtocol: cfg.inject,
    });
    if (!result.changed) return null;
    cfg.primed = result.primed;
    notify(result.rewrites);
    return result.body;
  }

  const origFetch = window.fetch;
  window.fetch = async function (input, init) {
    try {
      const url =
        typeof input === "string"
          ? input
          : input instanceof Request
            ? input.url
            : String(input);
      const api = Pho();
      if (api && cfg.enabled && api.isChatUrl(url)) {
        if (input instanceof Request && (init == null || init.body == null)) {
          if (input.method !== "GET" && input.method !== "HEAD") {
            const text = await input.clone().text();
            const next = rewriteBody(text, url);
            if (next != null) {
              const headers = new Headers(input.headers);
              headers.delete("content-length");
              const built = {
                method: input.method,
                headers,
                body: next,
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
        } else if (init && typeof init.body === "string") {
          const next = rewriteBody(init.body, url);
          if (next != null) {
            const headers = new Headers(init.headers || undefined);
            headers.delete("content-length");
            init = { ...init, body: next, headers };
          }
        }
      }
    } catch {
      /* never block the page */
    }
    return origFetch.apply(this, arguments);
  };

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__phoUrl = url;
    return origOpen.apply(this, arguments);
  };
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    try {
      if (typeof body === "string" && this.__phoUrl) {
        const next = rewriteBody(body, String(this.__phoUrl));
        if (next != null) body = next;
      }
    } catch {
      /* ignore */
    }
    return origSend.call(this, body);
  };

  const origWsSend = WebSocket.prototype.send;
  WebSocket.prototype.send = function (data) {
    try {
      if (typeof data === "string" && data.trim().startsWith("{")) {
        const url = this.url || location.href;
        const next = rewriteBody(data, url);
        if (next != null) data = next;
      }
    } catch {
      /* ignore */
    }
    return origWsSend.call(this, data);
  };
})();
