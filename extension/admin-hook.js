(() => {
  const source = "alto-vale-admin-panel";

  function notify(payload, url) {
    window.postMessage(
      {
        source,
        type: "ROUTE_IDS_FOUND",
        payload,
        url: String(url || window.location.href),
      },
      window.location.origin
    );
  }

  function inspectText(text, url) {
    window.postMessage(
      {
        source,
        type: "DIAGNOSTIC_URL",
        url: String(url || window.location.href),
      },
      window.location.origin
    );

    if (!text || !/\b\d{6,15}\b/.test(text)) {
      return;
    }

    try {
      notify(JSON.parse(text), url);
    } catch {
      if (/route|rota|monitoring|distribution/i.test(String(url || ""))) {
        notify(text, url);
      }
    }
  }

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    try {
      const url = String(args[0]?.url || args[0] || "");
      response
        .clone()
        .text()
        .then((text) => inspectText(text, url))
        .catch(() => {});
    } catch {}

    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__altoValeUrl = url;
    return originalOpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", () => {
      try {
        inspectText(this.responseText, this.__altoValeUrl);
      } catch {}
    });

    return originalSend.apply(this, args);
  };
})();
