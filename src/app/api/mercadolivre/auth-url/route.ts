import { randomBytes } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebaseAdmin";
import { criarUrlAutorizacao } from "@/lib/mercadoLivre";
import {
  exigirAdmin,
  respostaErroAutorizacao,
} from "@/lib/serverAuth";

export async function POST(request: Request) {
  try {
    const admin = await exigirAdmin(request);
    const state = randomBytes(32).toString("hex");

    await getAdminDb().collection("oauthStates").doc(state).set({
      provider: "mercadolivre",
      uid: admin.uid,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
    });

    return Response.json({ url: criarUrlAutorizacao(state) });
  } catch (error) {
    return respostaErroAutorizacao(error);
  }
}
