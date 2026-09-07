(() => {
  const source = "alto-vale-admin-panel";

  function notify(payload) {
    window.postMessage(
      {
        source,
        type: "ROUTE_IDS_FOUND",
        payload,
      },
      window.location.origin
    );
  }

  function inspectText(text) {
    if (!text || !/\b\d{6,15}\b/.test(text)) {
      return;
    }

    try {
      notify(JSON.parse(text));
    } catch {
      notify(text);
    }
  }

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);

    try {
      response
        .clone()
        .text()
        .then(inspectText)
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
        inspectText(this.responseText);
      } catch {}
    });

    return originalSend.apply(this, args);
  };
})();
