import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const COLLECTION = "metricas";

export async function criarMetrica(data: any) {
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
  return updateDoc(doc(db, COLLECTION, id), data);
}

export async function excluirMetrica(id: string) {
  return deleteDoc(doc(db, COLLECTION, id));
}