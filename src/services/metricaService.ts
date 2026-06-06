import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { criarLog } from "./logService";

const COLLECTION = "metricas";

export async function criarMetrica(data: any) {
  await criarLog(
  "CRIAR_METRICA",
  `Métrica criada para ${data.motoristaNome}`
);
  return addDoc(collection(db, COLLECTION), data);
}

export async function listarMetricas() {
  const snapshot = await getDocs(collection(db, COLLECTION));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function editarMetrica(id: string, data: any) {
  await criarLog(
  "EDITAR_METRICA",
  `Métrica atualizada: ${id}`
);
  return updateDoc(doc(db, COLLECTION, id), data);
}

export async function excluirMetrica(id: string) {
  await criarLog(
  "EXCLUIR_METRICA",
  `Métrica removida: ${id}`
);
  return deleteDoc(doc(db, COLLECTION, id));
}