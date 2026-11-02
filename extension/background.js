const ADMIN_PANEL_URL = "https://envios.adminml.com/*";
const ROUTE_DETAIL_URL =
  "/logistics/api/monitoring-route/route-detail?siteId=MLB&routeId=";
const routeIdsByTab = new Map();
const routeDatesByTab = new Map();
const diagnosticsByTab = new Map();
const lastSyncByTab = new Map();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "GET_DIAGNOSTICS") {
    getDiagnostics()
      .then((diagnostics) => sendResponse({ ok: true, diagnostics }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Falha ao verificar diagnostico",
        })
      );
    return true;
  }

  if (message?.type === "STORE_ROUTE_IDS") {
    storeRouteIds(
      _sender.tab?.id,
      message.routeIds,
      message.url,
      message.replace === true,
      message.routeDates
    );
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type === "STORE_DIAGNOSTIC") {
    storeDiagnostic(_sender.tab?.id, message.url);
    sendResponse({ ok: true });
    return false;
  }

  if (message?.type !== "SYNC_ROUTES" && message?.type !== "SYNC_VISIBLE_ROUTES") {
    return false;
  }

  const routeIdsPromise =
    message?.type === "SYNC_VISIBLE_ROUTES" ? getVisibleRouteIds() : Promise.resolve(message.routeIds);

  routeIdsPromise
    .then((routeIds) => syncRoutes(routeIds))
    .then((routes) => sendResponse({ ok: true, routes }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao sincronizar",
      })
    );

  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  routeIdsByTab.delete(tabId);
  routeDatesByTab.delete(tabId);
  diagnosticsByTab.delete(tabId);
  lastSyncByTab.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "loading" &&
    tab.url?.startsWith("https://envios.adminml.com/")
  ) {
    routeIdsByTab.delete(tabId);
    routeDatesByTab.delete(tabId);
    diagnosticsByTab.delete(tabId);
    lastSyncByTab.delete(tabId);
  }
});

function sanitizeUrl(value) {
  try {
    const url = new URL(String(value || ""), "https://envios.adminml.com");
    return `${url.origin}${url.pathname}`;
  } catch {
    return String(value || "").split("?")[0].slice(0, 200);
  }
}

function storeDiagnostic(tabId, url) {
  if (!tabId || !url) {
    return;
  }

  const currentState = diagnosticsByTab.get(tabId) || {
    urls: [],
    lastSeenAt: 0,
  };
  const sanitizedUrl = sanitizeUrl(url);

  if (
    sanitizedUrl &&
    /envios\.adminml\.com|logistics|route|rota|monitoring|distribution/i.test(
      sanitizedUrl
    ) &&
    !currentState.urls.includes(sanitizedUrl)
  ) {
    currentState.urls = [sanitizedUrl, ...currentState.urls].slice(0, 12);
  }

  currentState.lastSeenAt = Date.now();
  diagnosticsByTab.set(tabId, currentState);
}

function storeRouteIds(tabId, routeIds, url, replace = false, routeDates = {}) {
  if (!tabId || !Array.isArray(routeIds)) {
    return;
  }

  const previousState = routeIdsByTab.get(tabId);
  const currentState = {
    ids: replace ? new Set() : new Set(previousState?.ids || []),
    lastCaptureAt: 0,
    lastUrl: "",
  };

  for (const routeId of routeIds) {
    const normalizedId = String(routeId || "").trim();
    if (/^\d{6,15}$/.test(normalizedId)) {
      currentState.ids.add(normalizedId);
    }
  }

  currentState.lastCaptureAt = Date.now();
  currentState.lastUrl = String(url || "");
  routeIdsByTab.set(tabId, currentState);

  const currentDates = replace
    ? new Map()
    : new Map(routeDatesByTab.get(tabId) || []);
  for (const [routeId, routeDate] of Object.entries(routeDates || {})) {
    const normalizedId = String(routeId || "").trim();
    const normalizedDate = String(routeDate || "").trim();
    if (
      /^\d{6,15}$/.test(normalizedId) &&
      /^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)
    ) {
      currentDates.set(normalizedId, normalizedDate);
    }
  }
  routeDatesByTab.set(tabId, currentDates);
}

async function getDiagnostics() {
  const tabs = await chrome.tabs.query({ url: ADMIN_PANEL_URL });
  const panelTabs = tabs.filter((tab) => tab.id);

  const captured = panelTabs.map((tab) => {
    const state = routeIdsByTab.get(tab.id) || {
      ids: new Set(),
      lastCaptureAt: 0,
      lastUrl: "",
    };
    const diagnosticState = diagnosticsByTab.get(tab.id) || {
      urls: [],
      lastSeenAt: 0,
    };

    return {
      tabId: tab.id,
      title: tab.title || "",
      url: tab.url || "",
      routeCount: state.ids.size,
      lastCaptureAt: state.lastCaptureAt,
      lastUrl: state.lastUrl,
      diagnosticUrls: diagnosticState.urls,
      diagnosticLastSeenAt: diagnosticState.lastSeenAt,
      lastSync: lastSyncByTab.get(tab.id) || null,
    };
  });

  return {
    panelOpen: panelTabs.length > 0,
    totalRouteCount: captured.reduce((sum, item) => sum + item.routeCount, 0),
    tabs: captured,
  };
}

async function getVisibleRouteIds() {
  const tabs = await chrome.tabs.query({ url: ADMIN_PANEL_URL });
  const panelTab = selectPanelTab(tabs);

  if (!panelTab?.id) {
    throw new Error(
      "Abra o painel envios.adminml.com e entre na sua conta antes de sincronizar."
    );
  }

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: panelTab.id },
    world: "MAIN",
    func: () => {
      const ids = new Set();
      const addId = (value) => {
        const matches = String(value || "").match(/\b\d{6,15}\b/g) || [];
        for (const match of matches) {
          ids.add(match);
        }
      };

      for (const anchor of document.querySelectorAll("a[href]")) {
        const href = anchor.getAttribute("href") || "";
        if (href.includes("monitoring-distribution/detail")) {
          try {
            const link = new URL(href, window.location.origin);
            const pathMatch = link.pathname.match(/monitoring-distribution\/detail\/(\d{6,15})(?:\/|$)/i);
            const queryId =
              link.searchParams.get("routeId") ||
              link.searchParams.get("route_id") ||
              link.searchParams.get("idRota") ||
              link.searchParams.get("id_rota");
            if (pathMatch) addId(pathMatch[1]);
            if (queryId) addId(queryId);
          } catch {}
        }
      }

      return Array.from(ids).slice(0, 50);
    },
  });

  const capturedIds = Array.from(routeIdsByTab.get(panelTab.id)?.ids || []);
  const visibleIds = Array.isArray(result) ? result : [];
  const allIds = Array.from(new Set([...capturedIds, ...visibleIds])).slice(0, 50);

  if (allIds.length === 0) {
    throw new Error(
      "Nao encontrei IDs de rota na aba do Mercado Livre. Recarregue o monitoramento, aguarde as rotas aparecerem e tente sincronizar de novo."
    );
  }

  return allIds;
}

async function syncRoutes(routeIds) {
  const sanitizedIds = Array.from(
    new Set(
      (Array.isArray(routeIds) ? routeIds : [])
        .map((value) => String(value).trim())
        .filter((value) => /^\d{6,15}$/.test(value))
    )
  );

  if (sanitizedIds.length === 0) {
    throw new Error("Nenhum ID de rota valido foi informado.");
  }

  if (sanitizedIds.length > 50) {
    throw new Error("Sincronize no maximo 50 rotas por vez.");
  }

  const tabs = await chrome.tabs.query({ url: ADMIN_PANEL_URL });
  const panelTab = selectPanelTab(tabs);

  if (!panelTab?.id) {
    throw new Error(
      "Abra o painel envios.adminml.com e entre na sua conta antes de sincronizar."
    );
  }

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: panelTab.id },
    world: "MAIN",
    args: [
      sanitizedIds,
      ROUTE_DETAIL_URL,
      Object.fromEntries(routeDatesByTab.get(panelTab.id) || []),
    ],
    func: async (ids, routeDetailUrl, capturedRouteDates) => {
      function normalizeStatus(value) {
        return String(value || "")
          .trim()
          .toLowerCase()
          .replaceAll("-", "_")
          .replaceAll(" ", "_");
      }

      function collectTransportUnits(value, visited = new Set()) {
        if (!value || typeof value !== "object" || visited.has(value)) {
          return [];
        }

        visited.add(value);

        if (Array.isArray(value)) {
          return value.flatMap((item) => collectTransportUnits(item, visited));
        }

        const found = [];

        if (Array.isArray(value.transportUnits)) {
          found.push(...value.transportUnits);
        }

        for (const child of Object.values(value)) {
          if (child && typeof child === "object") {
            found.push(...collectTransportUnits(child, visited));
          }
        }

        const indexesById = new Map();
        const seenObjects = new Set();
        const uniqueUnits = [];

        for (const unit of found) {
          const rawId =
            unit?.id ?? unit?.transportUnitId ?? unit?.transport_unit_id;
          const normalizedId = String(rawId ?? "").trim();

          if (normalizedId) {
            const existingIndex = indexesById.get(normalizedId);

            if (existingIndex != null) {
              const existingUnit = uniqueUnits[existingIndex];
              if (
                isDelivered(getStatusValues(unit)) &&
                !isDelivered(getStatusValues(existingUnit))
              ) {
                uniqueUnits[existingIndex] = unit;
              }
              continue;
            }

            indexesById.set(normalizedId, uniqueUnits.length);
            uniqueUnits.push(unit);
            continue;
          }

          if (seenObjects.has(unit)) {
            continue;
          }

          seenObjects.add(unit);
          uniqueUnits.push(unit);
        }

        return uniqueUnits;
      }

      function getStatusValues(unit) {
        const related = unit?.relatedEntity || {};
        const delivery = unit?.delivery || related?.delivery || {};
        const shipment = unit?.shipment || related?.shipment || {};
        const order = unit?.order || related?.order || {};

        return [
          unit?.status,
          unit?.substatus,
          unit?.frontStatus,
          unit?.deliveryStatus,
          unit?.statusDetail,
          unit?.status_detail,
          related?.status,
          related?.substatus,
          related?.frontStatus,
          related?.statusDetail,
          related?.status_detail,
          delivery?.status,
          delivery?.substatus,
          shipment?.status,
          shipment?.substatus,
          order?.status,
          order?.substatus,
        ].map(normalizeStatus);
      }

      function getStatusFields(unit) {
        const related = unit?.relatedEntity || {};
        const delivery = unit?.delivery || related?.delivery || {};
        const shipment = unit?.shipment || related?.shipment || {};
        const order = unit?.order || related?.order || {};

        return {
          "unit.status": normalizeStatus(unit?.status),
          "unit.substatus": normalizeStatus(unit?.substatus),
          "unit.frontStatus": normalizeStatus(unit?.frontStatus),
          "unit.deliveryStatus": normalizeStatus(unit?.deliveryStatus),
          "unit.statusDetail": normalizeStatus(unit?.statusDetail || unit?.status_detail),
          "relatedEntity.status": normalizeStatus(related?.status),
          "relatedEntity.substatus": normalizeStatus(related?.substatus),
          "relatedEntity.frontStatus": normalizeStatus(related?.frontStatus),
          "relatedEntity.statusDetail": normalizeStatus(related?.statusDetail || related?.status_detail),
          "delivery.status": normalizeStatus(delivery?.status),
          "delivery.substatus": normalizeStatus(delivery?.substatus),
          "shipment.status": normalizeStatus(shipment?.status),
          "shipment.substatus": normalizeStatus(shipment?.substatus),
          "order.status": normalizeStatus(order?.status),
          "order.substatus": normalizeStatus(order?.substatus),
        };
      }

      function collectTransportUnitArrayDiagnostics(
        value,
        path = "$",
        results = new Map(),
        visited = new Set()
      ) {
        if (!value || typeof value !== "object" || visited.has(value)) {
          return results;
        }

        visited.add(value);

        if (Array.isArray(value)) {
          value.forEach((child, index) =>
            collectTransportUnitArrayDiagnostics(
              child,
              `${path}[${index}]`,
              results,
              visited
            )
          );
          return results;
        }

        for (const [key, child] of Object.entries(value)) {
          const childPath = `${path}.${key}`;

          if (key === "transportUnits" && Array.isArray(child)) {
            const pathPattern = childPath.replace(/\[\d+\]/g, "[*]");
            let diagnostic = results.get(pathPattern);

            if (!diagnostic) {
              diagnostic = {
                path: pathPattern,
                count: 0,
                fieldBreakdown: {},
              };
              results.set(pathPattern, diagnostic);
            }

            diagnostic.count += child.length;

            for (const unit of child) {
              for (const [field, status] of Object.entries(getStatusFields(unit || {}))) {
                if (!status) continue;
                diagnostic.fieldBreakdown[field] ||= {};
                diagnostic.fieldBreakdown[field][status] =
                  (diagnostic.fieldBreakdown[field][status] || 0) + 1;
              }
            }
          }

          if (child && typeof child === "object") {
            collectTransportUnitArrayDiagnostics(child, childPath, results, visited);
          }
        }

        return results;
      }

      function isDelivered(values) {
        return values.some(
          (value) =>
            value === "delivered" ||
            value === "delivery_done" ||
            value === "entregue"
        );
      }

      function isFailed(values) {
        const finalFailureStatuses = new Set([
          "not_delivered",
          "undelivered",
          "failed",
          "failure",
          "cancelled",
          "canceled",
          "returned",
          "refused_delivery",
          "rejected",
          "lost",
          "damaged",
          "stolen",
          "delivery_failed",
        ]);

        return values.some((value) => finalFailureStatuses.has(value));
      }

      function getRouteStatusValues(data) {
        return [
          data?.status,
          data?.routeStatus,
          data?.route_status,
          data?.state,
          data?.route?.status,
          data?.route?.substatus,
        ].map(normalizeStatus);
      }

      function isRouteClosed(values) {
        return values.some(
          (value) =>
            value.includes("close") ||
            value.includes("complete") ||
            value.includes("finish") ||
            value.includes("finaliz") ||
            value.includes("conclu") ||
            value.includes("ended") ||
            value.includes("encerr")
        );
      }

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
          if (compactDate) {
            return `${compactDate[1]}-${compactDate[2]}-${compactDate[3]}`;
          }
        }

        if (typeof value === "number" && Number.isFinite(value)) {
          const timestamp = value < 100000000000 ? value * 1000 : value;
          const date = new Date(timestamp);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        }

        return "";
      }

      function summarizeRoute(routeId, data) {
        const routeStatusValues = getRouteStatusValues(data);
        const units = collectTransportUnits(data);
        const transportUnitArrays = Array.from(
          collectTransportUnitArrayDiagnostics(data).values()
        );
        const statusBreakdown = {};
        const directTransportUnits = Array.isArray(data?.transportUnits)
          ? data.transportUnits.length
          : null;
        const transportUnitIds = new Set(
          units
            .map((unit) => unit?.id ?? unit?.transportUnitId ?? unit?.transport_unit_id)
            .filter((id) => id != null)
            .map(String)
        );

        let delivered = 0;
        let pending = 0;
        let failed = 0;

        for (const unit of units) {
          const values = getStatusValues(unit);
          const signature = Array.from(new Set(values.filter(Boolean)))
            .sort()
            .join(" + ") || "sem_status";
          statusBreakdown[signature] = (statusBreakdown[signature] || 0) + 1;

          if (isDelivered(values)) {
            delivered += 1;
          } else if (values.includes("transferred")) {
            continue;
          } else if (isFailed(values)) {
            failed += 1;
          } else {
            pending += 1;
          }
        }

        const routeClosed = isRouteClosed(routeStatusValues);
        const routeDateKeys = [
          "routeDate",
          "route_date",
          "deliveryDate",
          "delivery_date",
          "operationDate",
          "operation_date",
          "scheduledDate",
          "scheduled_date",
          "plannedDate",
          "planned_date",
          "serviceDate",
          "service_date",
          "date",
        ];
        const routeDateSources = [data, data?.route, data?.distributionRoute];
        let routeDate = "";

        for (const source of routeDateSources) {
          if (!source || typeof source !== "object") continue;
          for (const key of routeDateKeys) {
            routeDate = normalizeRouteDate(source[key]);
            if (routeDate) break;
          }
          if (routeDate) break;
        }

        return {
          routeId: String(data?.id || routeId),
          data: routeDate || String(capturedRouteDates?.[routeId] || ""),
          driverName: String(data?.driver?.driverName || "").trim(),
          cluster: String(data?.cluster || "").trim(),
          vehicleLicense: String(data?.license || "").trim(),
          status: routeClosed
            ? "closed"
            : String(
                data?.status ||
                  data?.routeStatus ||
                  data?.route_status ||
                  data?.route?.status ||
                  ""
              ).trim(),
          substatus: String(
            data?.substatus ||
              data?.statusDetail ||
              data?.status_detail ||
              data?.route?.substatus ||
              ""
          ).trim(),
          total: units.length,
          directTransportUnits,
          uniqueTransportUnitIdCount: transportUnitIds.size || null,
          transportUnitArrays,
          statusBreakdown,
          delivered,
          pending,
          failed,
          stops: Array.isArray(data?.stops) ? data.stops.length : 0,
        };
      }

      const results = [];

      for (const routeId of ids) {
        try {
          const separator = routeDetailUrl.includes("?") ? "&" : "?";
          const response = await fetch(
            `${routeDetailUrl}${encodeURIComponent(routeId)}${separator}_=${Date.now()}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
              headers: {
                Accept: "application/json",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            }
          );

          if (response.status === 401 || response.status === 403) {
            return {
              error:
                "A sessao do painel expirou ou nao possui permissao para esta rota.",
              unauthorized: true,
            };
          }

          if (!response.ok) {
            results.push({
              routeId,
              error: `Mercado Livre respondeu ${response.status}.`,
            });
          } else {
            const data = await response.json();
            results.push(summarizeRoute(routeId, data));
          }
        } catch {
          results.push({
            routeId,
            error: "Nao foi possivel consultar esta rota.",
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      return { routes: results };
    },
  });

  if (result?.unauthorized) {
    throw new Error(result.error);
  }

  if (!Array.isArray(result?.routes)) {
    throw new Error("O painel nao retornou dados de rotas.");
  }

  lastSyncByTab.set(panelTab.id, {
    syncedAt: Date.now(),
    routes: result.routes.map((route) => ({
      routeId: String(route.routeId || ""),
      data: String(route.data || ""),
      total: Number(route.total || 0),
      directTransportUnits:
        route.directTransportUnits == null
          ? null
          : Number(route.directTransportUnits),
      uniqueTransportUnitIdCount:
        route.uniqueTransportUnitIdCount == null
          ? null
          : Number(route.uniqueTransportUnitIdCount),
      transportUnitArrays: route.transportUnitArrays || [],
      delivered: Number(route.delivered || 0),
      pending: Number(route.pending || 0),
      failed: Number(route.failed || 0),
      statusBreakdown: route.statusBreakdown || {},
      error: route.error || "",
    })),
  });

  return result.routes;
}

function selectPanelTab(tabs) {
  const panelTabs = (Array.isArray(tabs) ? tabs : []).filter((tab) => tab.id);

  if (panelTabs.length === 0) {
    throw new Error(
      "Abra o painel envios.adminml.com e entre na sua conta antes de sincronizar."
    );
  }

  const tabsWithRecentCapture = panelTabs
    .map((tab) => ({
      tab,
      lastCaptureAt: routeIdsByTab.get(tab.id)?.lastCaptureAt || 0,
    }))
    .filter((item) => item.lastCaptureAt > 0)
    .sort((a, b) => b.lastCaptureAt - a.lastCaptureAt);

  if (tabsWithRecentCapture.length > 0) {
    return tabsWithRecentCapture[0].tab;
  }

  if (panelTabs.length === 1) {
    return panelTabs[0];
  }

  throw new Error(
    "Ha mais de uma aba do Mercado Livre aberta e nenhuma lista de rotas foi capturada. Feche as abas extras, recarregue o monitoramento e tente novamente."
  );
}
