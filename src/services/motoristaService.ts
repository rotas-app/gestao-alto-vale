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

const COLLECTION = "motoristas";

export async function criarMotorista(nomeCompleto: string) {
  await criarLog(
  "CRIAR_MOTORISTA",
  `Motorista criado: ${nomeCompleto}`
);
  return addDoc(collection(db, COLLECTION), {
    nomeCompleto,
    observacao: "",
    ativo: true,
    createdAt: new Date(),
  });
}

export async function listarMotoristas() {
  const snapshot = await getDocs(collection(db, COLLECTION));

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function editarMotorista(
  id: string,
  data: {
    nomeCompleto?: string;
    observacao?: string;
  }
) {
  await criarLog(
  "EDITAR_MOTORISTA",
  `Motorista atualizado: ${data.nomeCompleto}`
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