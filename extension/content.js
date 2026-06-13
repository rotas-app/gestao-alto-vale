const SOURCE = "alto-vale-site";
const EXTENSION_SOURCE = "alto-vale-extension";

window.addEventListener("message", async (event) => {
  if (event.source !== window || event.data?.source !== SOURCE) {
    return;
  }

  if (event.data.type === "ALTO_VALE_EXTENSION_PING") {
    window.postMessage(
      {
        source: EXTENSION_SOURCE,
        type: "ALTO_VALE_EXTENSION_READY",
        requestId: event.data.requestId,
      },
      window.location.origin
    );
    return;
  }

  if (event.data.type !== "ALTO_VALE_SYNC_ROUTES") {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SYNC_ROUTES",
      routeIds: event.data.routeIds,
    });

    window.postMessage(
      {
        source: EXTENSION_SOURCE,
        type: "ALTO_VALE_SYNC_RESULT",
        requestId: event.data.requestId,
        ...response,
      },
      window.location.origin
    );
  } catch (error) {
    window.postMessage(
      {
        source: EXTENSION_SOURCE,
        type: "ALTO_VALE_SYNC_RESULT",
        requestId: event.data.requestId,
        ok: false,
        error: error instanceof Error ? error.message : "Falha na extensao",
      },
      window.location.origin
    );
  }
});
