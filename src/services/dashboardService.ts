import { Metrica, DashboardData } from "@/types/metrica"
import {
  rankingDiario,
  rankingSemanal,
  rankingMensal,
  melhorMotorista,
  piorMotorista,
} from "@/services/rankingService"

/**
 * Gera o objeto completo do Dashboard a partir de todas as métricas.
 * Combina rankings diário, semanal e mensal em uma única estrutura.
 *
 * @param metricas - Lista completa de métricas do Firestore
 * @param dataHoje - Data atual no formato "YYYY-MM-DD"
 */
export function gerarDashboard(
  metricas: Metrica[],
  dataHoje: string
): DashboardData {
  const rankingDia = rankingDiario(metricas, dataHoje)
  const rankingSemana = rankingSemanal(metricas)
  const rankingMes = rankingMensal(metricas)

  return {
    melhorDia: melhorMotorista(rankingDia),
    melhorSemana: melhorMotorista(rankingSemana),
    melhorMes: melhorMotorista(rankingMes),
    piorDia: piorMotorista(rankingDia),
  }
}

/**
 * Calcula o DS médio geral de toda a operação no período das métricas fornecidas.
 */
export function dsMediaOperacao(metricas: Metrica[]): number {
  if (!metricas.length) return 0

  const soma = metricas.reduce((acc, m) => acc + m.ds, 0)
  return Number((soma / metricas.length).toFixed(2))
}

/**
 * Calcula totais operacionais consolidados.
 */
export function totaisOperacao(metricas: Metrica[]) {
  return {
    totalPacotes: metricas.reduce(
      (acc, m) => acc + m.qtdPacotesTotal, 0
    ),
    totalNaoEntregues: metricas.reduce(
      (acc, m) => acc + m.qtdPacotesNaoEntregues, 0
    ),
    totalMotoristas: new Set(
      metricas.map((m) => m.motoristaId)
    ).size,
  }
}
