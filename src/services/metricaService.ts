import {
  addDoc,
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const COLLECTION = "metricas";

export async function criarMetrica(
  data: any
) {
  return addDoc(
    collection(db, COLLECTION),
    data
  );
}

export async function listarMetricas() {

  const snapshot =
    await getDocs(
      collection(db, COLLECTION)
    );

  return snapshot.docs.map(
    (doc) => ({
      id: doc.id,
      ...doc.data(),
    })
  );
}