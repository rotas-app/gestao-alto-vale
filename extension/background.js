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
          .replaceAll("-", "_");
      }

      function summarizeRoute(routeId, data) {
        const units = (Array.isArray(data?.stops) ? data.stops : []).flatMap(
          (stop) =>
            (Array.isArray(stop?.orders) ? stop.orders : []).flatMap((order) =>
              Array.isArray(order?.transportUnits)
                ? order.transportUnits
                : []
            )
        );

        let delivered = 0;
        let pending = 0;
        let failed = 0;

        for (const unit of units) {
          const status = normalizeStatus(unit?.status);
          const frontStatus = normalizeStatus(
            unit?.relatedEntity?.frontStatus
          );
          const substatus = normalizeStatus(unit?.relatedEntity?.substatus);
          const values = [status, frontStatus, substatus];

          if (values.includes("delivered")) {
            delivered += 1;
          } else if (
            values.some((value) =>
              [
                "not_delivered",
                "failed",
                "failure",
                "cancelled",
                "canceled",
                "returned",
              ].includes(value)
            )
          ) {
            failed += 1;
          } else {
            pending += 1;
          }
        }

        return {
          routeId: String(data?.id || routeId),
          driverName: String(data?.driver?.driverName || "").trim(),
          cluster: String(data?.cluster || "").trim(),
          vehicleLicense: String(data?.license || "").trim(),
          status: String(data?.status || "").trim(),
          substatus: String(data?.substatus || "").trim(),
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
