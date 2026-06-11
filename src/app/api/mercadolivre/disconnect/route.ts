import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  exigirAdmin,
  respostaErroAutorizacao,
} from "@/lib/serverAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const admin = await exigirAdmin(request);

    await getAdminDb().doc("integracoes/mercadolivre").set(
      {
        connected: false,
        accessToken: FieldValue.delete(),
        refreshToken: FieldValue.delete(),
        disconnectedBy: admin.uid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return Response.json({ ok: true });
  } catch (error) {
    return respostaErroAutorizacao(error);
  }
}
