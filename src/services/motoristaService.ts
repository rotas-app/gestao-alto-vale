import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Motorista } from "@/types/motorista";
import { criarLog } from "./logService";

const COLLECTION = "motoristas";

export async function criarMotorista(
  nomeCompleto: string,
  baseId: string
) {
  await criarLog(
    "CRIAR_MOTORISTA",
    `Motorista criado: ${nomeCompleto} | Base: ${baseId}`
  );

  return addDoc(collection(db, COLLECTION), {
    nomeCompleto,
    observacao: "",
    ativo: true,
    baseId,
    createdAt: new Date(),
  });
}

export async function listarMotoristas(baseId?: string) {
  const snapshot = await getDocs(collection(db, COLLECTION));

  const motoristas = snapshot.docs.map(
    (documento) =>
      ({
        id: documento.id,
        ...documento.data(),
      }) as Motorista
  );

  if (!baseId) {
    return motoristas;
  }

  return motoristas.filter(
    (motorista) => !motorista.baseId || motorista.baseId === baseId
  );
}

export async function editarMotorista(
  id: string,
  data: {
    nomeCompleto?: string;
    observacao?: string;
    baseId?: string;
  }
) {
  await criarLog(
    "EDITAR_MOTORISTA",
    `Motorista atualizado: ${data.nomeCompleto || id}`
  );

  return updateDoc(doc(db, COLLECTION, id), data);
}

export async function excluirMotorista(id: string) {
  await criarLog(
    "EXCLUIR_MOTORISTA",
    `Motorista removido: ${id}`
  );

  return deleteDoc(doc(db, COLLECTION, id));
}
