import {
  consultarUsuario,
  obterAccessTokenValido,
} from "@/lib/mercadoLivre";
import {
  exigirAdmin,
  respostaErroAutorizacao,
} from "@/lib/serverAuth";

export async function POST(request: Request) {
  try {
    await exigirAdmin(request);
    const accessToken = await obterAccessTokenValido();
    const usuario = await consultarUsuario(accessToken);

    return Response.json({
      ok: true,
      user: {
        id: usuario.id,
        nickname: usuario.nickname,
        email: usuario.email || "",
        countryId: usuario.country_id || "",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "UNAUTHORIZED" || message === "FORBIDDEN") {
      return respostaErroAutorizacao(error);
    }

    console.error("Erro ao testar Mercado Livre:", error);
    return Response.json(
      { error: message || "Não foi possível testar a conexão." },
      { status: 502 }
    );
  }
}
