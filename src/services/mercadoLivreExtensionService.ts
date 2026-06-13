export interface RouteMetricsFromExtension {
  routeId: string;
  driverName: string;
  cluster: string;
  vehicleLicense: string;
  status: string;
  substatus: string;
  total: number;
  delivered: number;
  pending: number;
  failed: number;
  stops: number;
  error?: string;
}

interface ExtensionMessage {
  source?: string;
  type?: string;
  requestId?: string;
  ok?: boolean;
  routes?: RouteMetricsFromExtension[];
  error?: string;
}

const SITE_SOURCE = "alto-vale-site";
const EXTENSION_SOURCE = "alto-vale-extension";
const TIMEOUT_MS = 90_000;

function createRequestId() {
  return crypto.randomUUID();
}

function waitForExtensionMessage(
  requestId: string,
  expectedType: string,
  timeoutMs: number
) {
  return new Promise<ExtensionMessage>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      reject(new Error("A extensao nao respondeu dentro do tempo esperado."));
    }, timeoutMs);

    function handleMessage(event: MessageEvent<ExtensionMessage>) {
      if (
        event.source !== window ||
        event.origin !== window.location.origin ||
        event.data?.source !== EXTENSION_SOURCE ||
        event.data?.type !== expectedType ||
        event.data?.requestId !== requestId
      ) {
        return;
      }

      window.clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
      resolve(event.data);
    }

    window.addEventListener("message", handleMessage);
  });
}

export async function verificarExtensaoMercadoLivre() {
  const requestId = createRequestId();
  const responsePromise = waitForExtensionMessage(
    requestId,
    "ALTO_VALE_EXTENSION_READY",
    1_500
  );

  window.postMessage(
    {
      source: SITE_SOURCE,
      type: "ALTO_VALE_EXTENSION_PING",
      requestId,
    },
    window.location.origin
  );

  try {
    await responsePromise;
    return true;
  } catch {
    return false;
  }
}

export async function sincronizarRotasMercadoLivre(routeIds: string[]) {
  const normalizedIds = Array.from(
    new Set(
      routeIds
        .map((routeId) => String(routeId).trim())
        .filter((routeId) => /^\d{6,15}$/.test(routeId))
    )
  );

  if (normalizedIds.length === 0) {
    throw new Error("Nenhum ID de rota valido foi encontrado.");
  }

  const requestId = createRequestId();
  const responsePromise = waitForExtensionMessage(
    requestId,
    "ALTO_VALE_SYNC_RESULT",
    TIMEOUT_MS
  );

  window.postMessage(
    {
      source: SITE_SOURCE,
      type: "ALTO_VALE_SYNC_ROUTES",
      requestId,
      routeIds: normalizedIds,
    },
    window.location.origin
  );

  const response = await responsePromise;

  if (!response.ok) {
    throw new Error(response.error || "Nao foi possivel sincronizar as rotas.");
  }

  return response.routes || [];
}
