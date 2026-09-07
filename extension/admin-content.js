const ALTO_VALE_ADMIN_SOURCE = "alto-vale-admin-panel";

function extractRouteIds(value, ids = new Set(), visited = new Set()) {
  if (value == null || visited.has(value)) {
    return ids;
  }

  if (typeof value === "string" || typeof value === "number") {
    const matches = String(value).match(/\b\d{6,15}\b/g) || [];
    for (const match of matches) {
      ids.add(match);
    }
    return ids;
  }

  if (typeof value !== "object") {
    return ids;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      extractRouteIds(item, ids, visited);
    }
    return ids;
  }

  for (const [key, child] of Object.entries(value)) {
    if (/route|rota|id/i.test(key)) {
      extractRouteIds(child, ids, visited);
    } else if (child && typeof child === "object") {
      extractRouteIds(child, ids, visited);
    }
  }

  return ids;
}

window.addEventListener("message", (event) => {
  if (
    event.source !== window ||
    event.data?.source !== ALTO_VALE_ADMIN_SOURCE ||
    event.data?.type !== "ROUTE_IDS_FOUND"
  ) {
    return;
  }

  const routeIds = Array.from(extractRouteIds(event.data.payload)).slice(0, 50);

  if (routeIds.length === 0) {
    return;
  }

  chrome.runtime.sendMessage({
    type: "STORE_ROUTE_IDS",
    routeIds,
  });
});

const script = document.createElement("script");
script.src = chrome.runtime.getURL("admin-hook.js");
script.onload = () => script.remove();

(document.documentElement || document.head).appendChild(script);
script.remove();
