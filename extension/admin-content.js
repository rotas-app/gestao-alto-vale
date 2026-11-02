const ALTO_VALE_ADMIN_SOURCE = "alto-vale-admin-panel";
const ROUTE_ID_KEYS = /^(routeId|route_id|route|routeNumber|route_number|routeCode|route_code|idRota|id_rota|rotaId|rota_id)$/i;
const ROUTE_CONTAINER_KEYS = /^(routes?|routeList|route_list|rotas?|listaRotas|lista_rotas)$/i;
const ROUTE_SHAPE_KEYS = /^(driver|transportUnits|transport_units|stops|routeStatus|route_status|cluster|license|vehicleLicense|vehicle_license|routeNumber|route_number|routeCode|route_code)$/i;
const ROUTE_DATE_KEYS = /^(completionDate|completion_date|completedDate|completed_date|completedAt|completed_at|concludedAt|concluded_at|closedAt|closed_at|finishedAt|finished_at|endDate|end_date|routeEndDate|route_end_date|routeDate|route_date|deliveryDate|delivery_date|operationDate|operation_date|scheduledDate|scheduled_date|plannedDate|planned_date|serviceDate|service_date|date)$/i;
const ROUTE_CONTEXT_KEYS = /route|rota|monitoring|distribution/i;

function normalizeRouteDate(value) {
  if (typeof value === "string") {
    const text = value.trim();
    const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

    const brazilianDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brazilianDate) {
      return `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}`;
    }

    const compactDate = text.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (compactDate) return `${compactDate[1]}-${compactDate[2]}-${compactDate[3]}`;
    return "";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value < 100000000000 ? value * 1000 : value;
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  return "";
}

function addRouteIds(value, ids) {
  const matches = String(value || "").match(/\b\d{6,15}\b/g) || [];
  for (const match of matches) {
    ids.add(match);
  }
}

function inspectBrowserState() {
  const ids = new Set();
  const routeDates = {};
  const inspectText = (value, routeContext = false) => {
    if (routeContext || /route|rota|monitoring|distribution/i.test(String(value || ""))) {
      addRouteIds(value, ids);
    }
  };

  inspectText(
    window.location.href,
    /monitoring-distribution\/detail|routeId=/i.test(window.location.href)
  );

  try {
    const pageUrl = new URL(window.location.href);
    const routeId = pageUrl.pathname.match(
      /monitoring-distribution\/detail\/(\d{6,15})(?:\/|$)/i
    )?.[1];
    const completedMatch = (document.body?.innerText || "").match(
      /esta rota foi conclu[i\u00ed]da no dia\s+(\d{2})\/(\d{2})\/(\d{4})/i
    );

    if (routeId && completedMatch) {
      ids.add(routeId);
      routeDates[routeId] = `${completedMatch[3]}-${completedMatch[2]}-${completedMatch[1]}`;
    }
  } catch {}

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
      routeDates,
      url: window.location.href,
    });
  }
}

function extractRouteIds(
  value,
  ids = new Set(),
  visited = new Set(),
  routeRecord = false,
  allowGenericIdKey = false
) {
  if (value == null || visited.has(value)) {
    return ids;
  }

  if (typeof value === "string" || typeof value === "number") {
    if (routeRecord) {
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
      extractRouteIds(item, ids, visited, routeRecord, allowGenericIdKey);
    }
    return ids;
  }

  const routeLike = routeRecord || Object.keys(value).some((key) => ROUTE_SHAPE_KEYS.test(key));

  for (const [key, child] of Object.entries(value)) {
    if (ROUTE_ID_KEYS.test(key) || (allowGenericIdKey && key === "id" && routeLike)) {
      if (child && typeof child === "object") {
        extractRouteIds(
          child,
          ids,
          visited,
          ROUTE_CONTAINER_KEYS.test(key),
          allowGenericIdKey
        );
      } else {
        addRouteIds(child, ids);
      }
    } else if (child && typeof child === "object") {
      extractRouteIds(
        child,
        ids,
        visited,
        ROUTE_CONTAINER_KEYS.test(key),
        allowGenericIdKey
      );
    }
  }

  return ids;
}

function extractRouteDates(
  value,
  dates = new Map(),
  visited = new Set(),
  routeRecord = false,
  allowGenericIdKey = false
) {
  if (value == null || typeof value !== "object" || visited.has(value)) {
    return dates;
  }

  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      extractRouteDates(item, dates, visited, routeRecord, allowGenericIdKey);
    }
    return dates;
  }

  const routeLike = routeRecord || Object.keys(value).some((key) => ROUTE_SHAPE_KEYS.test(key));
  const routeIdEntry = Object.entries(value).find(
    ([key, child]) =>
      ROUTE_ID_KEYS.test(key) ||
      (allowGenericIdKey && key === "id" && routeLike && child != null)
  );

  if (routeLike && routeIdEntry) {
    const routeId = String(routeIdEntry[1] || "").trim();
    if (/^\d{6,15}$/.test(routeId)) {
      for (const [key, child] of Object.entries(value)) {
        if (!ROUTE_DATE_KEYS.test(key)) continue;
        const routeDate = normalizeRouteDate(child);
        if (routeDate) {
          dates.set(routeId, routeDate);
          break;
        }
      }
    }
  }

  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === "object") {
      extractRouteDates(
        child,
        dates,
        visited,
        ROUTE_CONTAINER_KEYS.test(key),
        allowGenericIdKey
      );
    }
  }

  return dates;
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
  const isRouteList = /\/logistics\/api\/monitoring\/get-routes-list(?:[/?]|$)/i.test(sourceUrl);
  const routeIds = Array.from(
    extractRouteIds(
      event.data.payload,
      new Set(),
      new Set(),
      false,
      isRouteList
    )
  ).slice(0, 50);
  const routeDates = Object.fromEntries(
    isRouteList
      ? extractRouteDates(
          event.data.payload,
          new Map(),
          new Set(),
          false,
          true
        )
      : []
  );

  if (routeIds.length === 0 && !isRouteList) {
    return;
  }

  chrome.runtime.sendMessage({
    type: "STORE_ROUTE_IDS",
    routeIds,
    routeDates,
    replace: isRouteList,
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
