import { listarMetricas } from "./metricaService";

export interface RankingItem {
  motoristaNome: string;
  totalPacotes: number;
  totalInsucessos: number;
  totalDS: number;
  registros: number;
  dsMedia: number;
}

type RankingAcumulado = Omit<RankingItem, "dsMedia">;

export async function gerarRankingPorPeriodo(
  periodo: "dia" | "semana" | "mes",
  baseId?: string
) {
  const metricas = await listarMetricas(baseId);
  const hoje = new Date();

  const filtradas = metricas.filter((item) => {
    if (!item.data) return false;

    const data = new Date(`${item.data}T00:00:00`);

    if (periodo === "dia") {
      return data.toDateString() === hoje.toDateString();
    }

    if (periodo === "semana") {
      const diff =
        (hoje.getTime() - data.getTime()) /
        (1000 * 60 * 60 * 24);

      return diff >= 0 && diff <= 7;
    }

    return (
      data.getMonth() === hoje.getMonth() &&
      data.getFullYear() === hoje.getFullYear()
    );
  });

  const agrupado: Record<string, RankingAcumulado> = {};

  filtradas.forEach((item) => {
    if (!agrupado[item.motoristaId]) {
      agrupado[item.motoristaId] = {
        motoristaNome: item.motoristaNome,
        totalPacotes: 0,
        totalInsucessos: 0,
        totalDS: 0,
        registros: 0,
      };
    }

    const motorista = agrupado[item.motoristaId];

    motorista.totalPacotes += Number(item.qtdPacotesTotal || 0);
    motorista.totalInsucessos += Number(
      item.qtdPacotesNaoEntregues || 0
    );
    motorista.totalDS += Number(item.ds || 0);
    motorista.registros += 1;
  });

  return Object.values(agrupado)
    .map<RankingItem>((item) => ({
      ...item,
      dsMedia: Number((item.totalDS / item.registros).toFixed(2)),
    }))
    .sort((a, b) => b.dsMedia - a.dsMedia);
}
