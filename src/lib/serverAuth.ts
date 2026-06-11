import "server-only";

import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export async function exigirAdmin(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const idToken = authorization.slice("Bearer ".length);
  const decodedToken = await getAdminAuth().verifyIdToken(idToken);
  const usuario = await getAdminDb()
    .collection("usuarios")
    .doc(decodedToken.uid)
    .get();

  const perfil = usuario.data();

  if (
    !usuario.exists ||
    perfil?.cargo !== "admin" ||
    perfil?.status !== "ativo"
  ) {
    throw new Error("FORBIDDEN");
  }

  return {
    uid: decodedToken.uid,
    email: decodedToken.email || perfil.email || "",
  };
}

export function respostaErroAutorizacao(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "UNAUTHORIZED") {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  if (message === "FORBIDDEN") {
    return Response.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  console.error("Erro de autorização:", error);
  return Response.json(
    { error: "Não foi possível validar o acesso." },
    { status: 500 }
  );
}
