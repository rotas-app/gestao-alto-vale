export const runtime = "nodejs";

export async function GET() {
  const variaveis = {
    clientId: Boolean(process.env.MERCADOLIVRE_CLIENT_ID),
    clientSecret: Boolean(process.env.MERCADOLIVRE_CLIENT_SECRET),
    redirectUri: Boolean(process.env.MERCADOLIVRE_REDIRECT_URI),
    encryptionKey: Boolean(process.env.MERCADOLIVRE_TOKEN_ENCRYPTION_KEY),
    firebaseProjectId: Boolean(
      process.env.FIREBASE_ADMIN_PROJECT_ID ||
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ),
    firebaseClientEmail: Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL),
    firebasePrivateKey: Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
  };

  try {
    const { getAdminDb } = await import("@/lib/firebaseAdmin");

    getAdminDb();

    return Response.json({
      ok: true,
      node: process.version,
      variaveis,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        node: process.version,
        variaveis,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao iniciar Firebase Admin.",
      },
      { status: 500 }
    );
  }
}
