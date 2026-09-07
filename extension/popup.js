const panelStatus = document.getElementById("panel-status");
const routeCount = document.getElementById("route-count");
const lastCapture = document.getElementById("last-capture");
const statusHelp = document.getElementById("status-help");
const extensionVersion = document.getElementById("extension-version");

extensionVersion.textContent = chrome.runtime.getManifest().version;

function formatLastCapture(value) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

chrome.runtime.sendMessage({ type: "GET_DIAGNOSTICS" }, (response) => {
  if (!response?.ok) {
    panelStatus.textContent = "Erro";
    routeCount.textContent = "-";
    lastCapture.textContent = "-";
    statusHelp.textContent =
      response?.error || "Nao foi possivel verificar a extensao.";
    return;
  }

  const diagnostics = response.diagnostics;
  const tabs = diagnostics.tabs || [];
  const latestCapture = tabs.reduce(
    (latest, tab) => Math.max(latest, tab.lastCaptureAt || 0),
    0
  );

  panelStatus.textContent = diagnostics.panelOpen ? "Aberto" : "Nao aberto";
  routeCount.textContent = String(diagnostics.totalRouteCount || 0);
  lastCapture.textContent = formatLastCapture(latestCapture);

  if (!diagnostics.panelOpen) {
    statusHelp.textContent =
      "Abra envios.adminml.com e entre na conta autorizada.";
  } else if (!diagnostics.totalRouteCount) {
    statusHelp.textContent =
      "Recarregue o monitoramento e aguarde as rotas aparecerem.";
  } else {
    statusHelp.textContent =
      "Pronto para sincronizar no Gestao Alto Vale.";
  }
});
