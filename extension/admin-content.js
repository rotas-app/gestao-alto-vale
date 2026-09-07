const ALTO_VALE_ADMIN_SOURCE = "alto-vale-admin-panel";
const ROUTE_ID_KEYS = /^(routeId|route_id|route|routeNumber|route_number|routeCode|route_code|idRota|id_rota|rotaId|rota_id)$/i;
const ROUTE_CONTEXT_KEYS = /route|rota|monitoring|distribution/i;

function addRouteIds(value, ids) {
  const matches = String(value || "").match(/\b\d{6,15}\b/g) || [];
  for (const match of matches) {
    ids.add(match);
  }
}

function inspectBrowserState() {
  const ids = new Set();
  const inspectText = (value, routeContext = false) => {
    if (routeContext || /route|rota|monitoring|distribution/i.test(String(value || ""))) {
      addRouteIds(value, ids);
    }
  };

  inspectText(
    window.location.href,
    /monitoring-distribution\/detail|routeId=/i.test(window.location.href)
  );

  for (const entry of performance.getEntriesByType("resource")) {
    inspectText(
      entry.name,
      /monitoring-distribution\/detail|monitoring-route\/route-detail|routeId=/i.test(entry.name)
    );
  }

  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index) || "";
        const value = storage.getItem(key) || "";
        if (ROUTE_CONTEXT_KEYS.test(key)) {
          inspectText(key, true);
          try {
            extractRouteIds(JSON.parse(value), ids);
          } catch {}
        }
      }
    } catch {}
  }

  if (ids.size > 0) {
    chrome.runtime.sendMessage({
      type: "STORE_ROUTE_IDS",
      routeIds: Array.from(ids).slice(0, 50),
      url: window.location.href,
    });
  }
}

function extractRouteIds(
  value,
  ids = new Set(),
  visited = new Set(),
  routeContext = false,
  allowGenericIdKey = false
) {
  if (value == null || visited.has(value)) {
    return ids;
  }

  if (typeof value === "string" || typeof value === "number") {
    if (routeContext) {
      addRouteIds(value, ids);
    }
    return ids;
  }

  if (typeof value !== "object") {
    return ids;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      extractRouteIds(item, ids, visited, routeContext, allowGenericIdKey);
    }
    return ids;
  }

  for (const [key, child] of Object.entries(value)) {
    if (ROUTE_ID_KEYS.test(key) || (allowGenericIdKey && key === "id")) {
      addRouteIds(child, ids);
    } else if (child && typeof child === "object") {
      extractRouteIds(
        child,
        ids,
        visited,
        routeContext || ROUTE_CONTEXT_KEYS.test(key),
        allowGenericIdKey
      );
    }
  }

  return ids;
}

window.addEventListener("message", (event) => {
  if (
    event.source !== window ||
    event.data?.source !== ALTO_VALE_ADMIN_SOURCE
  ) {
    return;
  }

  if (event.data?.type === "DIAGNOSTIC_URL") {
    chrome.runtime.sendMessage({
      type: "STORE_DIAGNOSTIC",
      url: event.data.url || window.location.href,
    });
    return;
  }

  if (event.data?.type !== "ROUTE_IDS_FOUND") {
    return;
  }

  const sourceUrl = String(event.data.url || "");
  const routeIds = Array.from(
    extractRouteIds(
      event.data.payload,
      new Set(),
      new Set(),
      false,
      sourceUrl.includes("/logistics/api/monitoring/get-routes-list")
    )
  ).slice(0, 50);

  if (routeIds.length === 0) {
    return;
  }

  chrome.runtime.sendMessage({
    type: "STORE_ROUTE_IDS",
    routeIds,
    url: event.data.url || window.location.href,
  });
});

const script = document.createElement("script");
script.src = chrome.runtime.getURL("admin-hook.js");
script.onload = () => script.remove();

(document.documentElement || document.head).appendChild(script);
script.remove();

window.setTimeout(inspectBrowserState, 1500);
window.setTimeout(inspectBrowserState, 5000);
