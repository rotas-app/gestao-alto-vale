const ADMIN_PANEL_URL = "https://envios.adminml.com/*";
const ROUTE_DETAIL_URL =
  "/logistics/api/monitoring-route/route-detail?siteId=MLB&routeId=";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "SYNC_ROUTES") {
    return false;
  }

  syncRoutes(message.routeIds)
    .then((routes) => sendResponse({ ok: true, routes }))
    .catch((error) =>
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao sincronizar",
      })
    );

  return true;
});

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
          data?.substatus,
          data?.routeStatus,
          data?.route_status,
          data?.state,
          data?.frontStatus,
          data?.statusDetail,
          data?.status_detail,
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

        if (routeClosed && pending > 0) {
          failed += pending;
          pending = 0;
        }

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
          const response = await fetch(
            `${routeDetailUrl}${encodeURIComponent(routeId)}`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
              headers: {
                Accept: "application/json",
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
