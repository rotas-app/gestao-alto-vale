import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export async function criarLog(
  acao: string,
  detalhes: string
) {
  const user = auth.currentUser;

  await addDoc(collection(db, "logs"), {
    acao,
    detalhes,
    usuario: user?.email || "desconhecido",
    uid: user?.uid || null,
    createdAt: new Date(),
  });
}

export async function listarLogs() {
  const q = query(
    collection(db, "logs"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}