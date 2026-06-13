import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Motorista } from "@/types/motorista";
import { criarLog } from "./logService";

const COLLECTION = "motoristas";

export function normalizarNomeMotorista(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export async function criarMotorista(
  nomeCompleto: string,
  baseId: string
) {
  const nomeLimpo = nomeCompleto.trim();
  const nomeNormalizado = normalizarNomeMotorista(nomeLimpo);
  const motoristas = await listarMotoristas(baseId);
  const existente = motoristas.find(
    (motorista) =>
      normalizarNomeMotorista(motorista.nomeCompleto) === nomeNormalizado
  );

  if (existente) {
    return existente;
  }

  await criarLog(
    "CRIAR_MOTORISTA",
    `Motorista criado: ${nomeLimpo} | Base: ${baseId}`
  );

  const motoristaId = encodeURIComponent(`${baseId}__${nomeNormalizado}`);
  const referencia = doc(db, COLLECTION, motoristaId);

  await setDoc(referencia, {
    nomeCompleto: nomeLimpo,
    nomeNormalizado,
    observacao: "",
    ativo: true,
    baseId,
    createdAt: new Date(),
  });

  return {
    id: motoristaId,
    nomeCompleto: nomeLimpo,
    nomeNormalizado,
    observacao: "",
    ativo: true,
    baseId,
  } satisfies Motorista;
}

export async function listarMotoristas(baseId?: string) {
  const consulta = baseId
    ? query(collection(db, COLLECTION), where("baseId", "==", baseId))
    : query(collection(db, COLLECTION));
  const snapshot = await getDocs(consulta);

  return snapshot.docs.map(
    (documento) =>
      ({
        id: documento.id,
        ...documento.data(),
      }) as Motorista
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
