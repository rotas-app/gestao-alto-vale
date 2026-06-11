import { getAdminDb } from "@/lib/firebaseAdmin";
import { trocarCodigoPorToken } from "@/lib/mercadoLivre";

function redirecionar(request: Request, status: string) {
  return Response.redirect(
    new URL(`/integracoes?mercadolivre=${status}`, request.url)
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return redirecionar(request, "erro-parametros");
  }

  const stateRef = getAdminDb().collection("oauthStates").doc(state);

  try {
    const snapshot = await stateRef.get();
    const data = snapshot.data();

    if (
      !snapshot.exists ||
      data?.provider !== "mercadolivre" ||
      !data.expiresAt ||
      data.expiresAt.toMillis() < Date.now()
    ) {
      return redirecionar(request, "erro-state");
    }

    await stateRef.delete();
    await trocarCodigoPorToken(code, data.uid);

    return redirecionar(request, "conectado");
  } catch (error) {
    console.error("Erro no callback do Mercado Livre:", error);
    await stateRef.delete().catch(() => undefined);
    return redirecionar(request, "erro-autorizacao");
  }
}
