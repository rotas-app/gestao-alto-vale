import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  writeBatch,
  updateDoc,
  where,
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
  const consulta = baseId
    ? query(collection(db, COLLECTION), where("baseId", "==", baseId))
    : query(collection(db, COLLECTION));
  const snapshot = await getDocs(consulta);

  return snapshot.docs.map(
    (documento) =>
      ({
        id: documento.id,
        ...documento.data(),
      }) as Metrica
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

export interface AtualizacaoMetricaMercadoLivre {
  id: string;
  motoristaId?: string;
  motoristaNome: string;
  motoristaNomeMercadoLivre: string;
  codigoGaiola: string;
  qtdPacotesTotal: number;
  qtdPacotesEntregues: number;
  qtdPacotesNaoEntregues: number;
  qtdPacotesPendentes: number;
  qtdPacotesFalhas: number;
  qtdParadas: number;
  statusRota: string;
  substatusRota: string;
  placaVeiculo: string;
  ds: number;
}

export async function atualizarMetricasMercadoLivre(
  atualizacoes: AtualizacaoMetricaMercadoLivre[]
) {
  if (atualizacoes.length === 0) {
    return;
  }

  const batch = writeBatch(db);

  for (const atualizacao of atualizacoes) {
    const {
      id,
      motoristaId,
      ...dados
    } = atualizacao;

    batch.update(doc(db, COLLECTION, id), {
      ...dados,
      ...(motoristaId ? { motoristaId } : {}),
      origemSincronizacao: "mercado_livre_extensao",
      sincronizadoEm: new Date(),
      updatedAt: new Date(),
    });
  }

  await batch.commit();
  await criarLog(
    "SINCRONIZAR_METRICAS_MERCADO_LIVRE",
    `${atualizacoes.length} metrica(s) atualizada(s) por extensao`
  );
}
