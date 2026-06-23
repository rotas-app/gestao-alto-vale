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

function parseDataLocal(data: string) {
  return new Date(`${data}T12:00:00`);
}

function inicioDoDia(data: Date) {
  const inicio = new Date(data);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

function fimDoDia(data: Date) {
  const fim = new Date(data);
  fim.setHours(23, 59, 59, 999);
  return fim;
}

function intervaloSemanaDomingoSabado(data: Date) {
  const inicio = inicioDoDia(data);
  inicio.setDate(inicio.getDate() - inicio.getDay());

  const fim = fimDoDia(inicio);
  fim.setDate(inicio.getDate() + 6);

  return { inicio, fim };
}

export async function gerarRankingPorPeriodo(
  periodo: "dia" | "semana" | "mes",
  baseId?: string
) {
  const metricas = await listarMetricas(baseId);
  const hoje = new Date();

  const filtradas = metricas.filter((item) => {
    if (!item.data || !item.motoristaId) return false;

    const data = parseDataLocal(item.data);

    if (periodo === "dia") {
      return data.toDateString() === hoje.toDateString();
    }

    if (periodo === "semana") {
      const { inicio, fim } = intervaloSemanaDomingoSabado(hoje);

      return data >= inicio && data <= fim;
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
