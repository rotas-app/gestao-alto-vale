import { listarMetricas } from "./metricaService";

export async function gerarRankingPorPeriodo(
  periodo: "dia" | "semana" | "mes"
) {
  const metricas: any[] = await listarMetricas();

  const hoje = new Date();

  const filtradas = metricas.filter((item) => {
    if (!item.data) return false;

    const data = new Date(item.data);

    if (periodo === "dia") {
      return (
        data.toDateString() === hoje.toDateString()
      );
    }

    if (periodo === "semana") {
      const diff =
        (hoje.getTime() - data.getTime()) /
        (1000 * 60 * 60 * 24);

      return diff <= 7;
    }

    if (periodo === "mes") {
      return (
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      );
    }

    return true;
  });

  const agrupado: any = {};

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

    agrupado[item.motoristaId].totalPacotes +=
      Number(item.qtdPacotesTotal || 0);

    agrupado[item.motoristaId].totalInsucessos +=
      Number(item.qtdPacotesNaoEntregues || 0);

    agrupado[item.motoristaId].totalDS +=
      Number(item.ds || 0);

    agrupado[item.motoristaId].registros += 1;
  });

  return Object.values(agrupado)
    .map((item: any) => ({
      ...item,
      dsMedia: Number(
        (item.totalDS / item.registros).toFixed(2)
      ),
    }))
    .sort((a: any, b: any) => b.dsMedia - a.dsMedia);
}