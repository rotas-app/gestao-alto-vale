import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const COLLECTION = "motoristas";

export async function criarMotorista(nomeCompleto: string) {
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
  return updateDoc(doc(db, COLLECTION, id), data);
}

export async function excluirMotorista(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}