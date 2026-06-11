import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Metrica } from "@/types/metricas";
import { criarLog } from "./logService";

const COLLECTION = "metricas";

type MetricaInput = Omit<Metrica, "id" | "createdAt" | "updatedAt"> & {
  baseId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export async function criarMetrica(data: MetricaInput) {
  await criarLog(
    "CRIAR_METRICA",
    `Métrica criada para ${data.motoristaNome} | Base: ${data.baseId}`
  );

  return addDoc(collection(db, COLLECTION), data);
}

export async function listarMetricas(baseId?: string) {
  const snapshot = await getDocs(collection(db, COLLECTION));

  const metricas = snapshot.docs.map(
    (documento) =>
      ({
        id: documento.id,
        ...documento.data(),
      }) as Metrica
  );

  if (!baseId) {
    return metricas;
  }

  return metricas.filter(
    (metrica) => !metrica.baseId || metrica.baseId === baseId
  );
}

export async function editarMetrica(
  id: string,
  data: Partial<MetricaInput>
) {
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
