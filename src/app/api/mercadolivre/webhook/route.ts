import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebaseAdmin";

interface MercadoLivreNotification {
  resource?: string;
  user_id?: number;
  topic?: string;
  application_id?: number;
  attempts?: number;
  sent?: string;
  received?: string;
}

export async function POST(request: Request) {
  try {
    const notification = (await request.json()) as MercadoLivreNotification;
    const clientId = process.env.MERCADOLIVRE_CLIENT_ID;

    if (
      clientId &&
      notification.application_id &&
      String(notification.application_id) !== clientId
    ) {
      return Response.json({ ok: true, ignored: true });
    }

    if (!notification.topic || !notification.resource) {
      return Response.json({ ok: true, ignored: true });
    }

    await getAdminDb().collection("mercadolivreNotificacoes").add({
      topic: String(notification.topic).slice(0, 100),
      resource: String(notification.resource).slice(0, 500),
      userId: notification.user_id ? String(notification.user_id) : "",
      applicationId: notification.application_id
        ? String(notification.application_id)
        : "",
      attempts: Number(notification.attempts || 0),
      sent: notification.sent || "",
      received: notification.received || "",
      createdAt: FieldValue.serverTimestamp(),
      processed: false,
    });
  } catch (error) {
    console.error("Erro ao receber webhook do Mercado Livre:", error);
  }

  return Response.json({ ok: true });
}
