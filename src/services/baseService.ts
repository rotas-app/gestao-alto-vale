import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { criarLog } from "./logService";

const COLLECTION = "bases";

export interface BaseInput {
  id: string;
  nome: string;
  ativo: boolean;
}

export async function listarBases(ativasOnly = false) {
  const consulta = ativasOnly
    ? query(collection(db, COLLECTION), where("ativo", "==", true))
    : query(collection(db, COLLECTION));

  const snapshot = await getDocs(consulta);

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  })) as BaseInput[];
}

export async function salvarBase(base: BaseInput) {
  const id = base.id.trim().toLowerCase();
  const nome = base.nome.trim();

  if (!/^[a-z0-9-]{3,40}$/.test(id)) {
    throw new Error("Use um ID com letras minusculas, numeros ou hifen.");
  }

  if (!nome) {
    throw new Error("Informe o nome da base.");
  }

  const ref = doc(db, COLLECTION, id);
  const existente = await getDoc(ref);

  await setDoc(
    ref,
    {
      id,
      nome,
      ativo: base.ativo,
      updatedAt: new Date(),
      ...(existente.exists() ? {} : { createdAt: new Date() }),
    },
    { merge: true }
  );

  await criarLog(
    existente.exists() ? "EDITAR_BASE" : "CRIAR_BASE",
    `Base ${nome} (${id}) ${base.ativo ? "ativa" : "inativa"}`
  );
}

export async function alterarStatusBase(id: string, ativo: boolean) {
  await updateDoc(doc(db, COLLECTION, id), {
    ativo,
    updatedAt: new Date(),
  });

  await criarLog(
    ativo ? "ATIVAR_BASE" : "DESATIVAR_BASE",
    `Base ${id} ${ativo ? "ativada" : "desativada"}`
  );
}
