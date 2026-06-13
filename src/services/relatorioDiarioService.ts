import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { RelatorioDiario } from "@/types/relatorioDiario";

const COLLECTION = "relatoriosDiarios";

function criarId(baseId: string, data: string) {
  return encodeURIComponent(`${baseId}__${data}`);
}

export async function buscarRelatorioDiario(baseId: string, data: string) {
  const consulta = query(
    collection(db, COLLECTION),
    where("baseId", "==", baseId)
  );
  const snapshot = await getDocs(consulta);
  const documento = snapshot.docs.find(
    (item) => item.data().data === data
  );

  if (!documento) {
    return null;
  }

  return {
    id: documento.id,
    ...documento.data(),
  } as RelatorioDiario;
}

export async function salvarRelatorioDiario(
  dados: Omit<RelatorioDiario, "id" | "updatedAt">
) {
  const referencia = doc(
    db,
    COLLECTION,
    criarId(dados.baseId, dados.data)
  );

  await setDoc(
    referencia,
    {
      ...dados,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}
