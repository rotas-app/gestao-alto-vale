const ADMIN_PANEL_URL = "https://envios.adminml.com/*";
const ROUTE_DETAIL_URL =
  "/logistics/api/monitoring-route/route-detail?siteId=MLB&routeId=";
const routeIdsByTab = new Map();

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
    storeRouteIds(_sender.tab?.id, message.routeIds, message.url);
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
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "loading" &&
    tab.url?.startsWith("https://envios.adminml.com/")
  ) {
    routeIdsByTab.delete(tabId);
  }
});

function storeRouteIds(tabId, routeIds, url) {
  if (!tabId || !Array.isArray(routeIds)) {
    return;
  }

  const currentState = routeIdsByTab.get(tabId) || {
    ids: new Set(),
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

    return {
      tabId: tab.id,
      title: tab.title || "",
      url: tab.url || "",
      routeCount: state.ids.size,
      lastCaptureAt: state.lastCaptureAt,
      lastUrl: state.lastUrl,
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
  const panelTab = tabs.find((tab) => tab.id);

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
          addId(href);
          addId(anchor.textContent);
        }
      }

      return Array.from(ids).slice(0, 50);
    },
  });

  const capturedIds = Array.from(routeIdsByTab.get(panelTab.id)?.ids || []);
  const allIds = Array.from(new Set([...(Array.isArray(result) ? result : []), ...capturedIds])).slice(0, 50);

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
  const panelTab = tabs.find((tab) => tab.id);

  if (!panelTab?.id) {
    throw new Error(
      "Abra o painel envios.adminml.com e entre na sua conta antes de sincronizar."
    );
  }

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: panelTab.id },
    world: "MAIN",
    args: [sanitizedIds, ROUTE_DETAIL_URL],
    func: async (ids, routeDetailUrl) => {
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

        return Array.from(new Set(found));
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

      function isDelivered(values) {
        return values.some(
          (value) =>
            value === "delivered" ||
            value === "delivery_done" ||
            value === "entregue"
        );
      }

      function isFailed(values) {
        const failedStatuses = [
          "not_delivered",
          "undelivered",
          "failed",
          "failure",
          "cancelled",
          "canceled",
          "returned",
          "return",
          "refused",
          "rejected",
          "recipient_absent",
          "buyer_absent",
          "absent",
          "address_not_found",
          "bad_address",
          "inaccessible",
          "inaccessible_address",
          "lost",
          "damaged",
          "stolen",
          "delivery_failed",
        ];

        return values.some((value) =>
          failedStatuses.some((status) => value.includes(status))
        );
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

      function summarizeRoute(routeId, data) {
        const routeStatusValues = getRouteStatusValues(data);
        const units = collectTransportUnits(data);

        let delivered = 0;
        let pending = 0;
        let failed = 0;

        for (const unit of units) {
          const values = getStatusValues(unit);

          if (isDelivered(values)) {
            delivered += 1;
          } else if (isFailed(values)) {
            failed += 1;
          } else {
            pending += 1;
          }
        }

        const routeClosed = isRouteClosed(routeStatusValues);

        return {
          routeId: String(data?.id || routeId),
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

  return result.routes;
}
