import { listarMetricas } from "@/services/metricaService";

interface Metrica {
  id: string;
  motoristaId: string;
  motoristaNome: string;
  data: string;
  qtdPacotesTotal: number;
  qtdPacotesNaoEntregues: number;
  ds: number;
}

interface RankingItem {
  motoristaId: string;
  motoristaNome: string;
  totalRegistros: number;
  totalPacotes: number;
  totalInsucessos: number;
  dsMedia: number;
  posicao: number;
}

export async function gerarRankingGeral(): Promise<RankingItem[]> {
  const metricas = await listarMetricas() as Metrica[];

  const agrupado = new Map<string, Metrica[]>();

  metricas.forEach((metrica) => {
    if (!metrica.motoristaId) return;

    const lista = agrupado.get(metrica.motoristaId) || [];
    lista.push(metrica);
    agrupado.set(metrica.motoristaId, lista);
  });

  const ranking: Omit<RankingItem, "posicao">[] = [];

  agrupado.forEach((lista) => {
    const totalRegistros = lista.length;

    const totalPacotes = lista.reduce(
      (acc, item) => acc + Number(item.qtdPacotesTotal || 0),
      0
    );

    const totalInsucessos = lista.reduce(
      (acc, item) => acc + Number(item.qtdPacotesNaoEntregues || 0),
      0
    );

    const dsMedia =
      totalRegistros > 0
        ? Number(
            (
              lista.reduce((acc, item) => acc + Number(item.ds || 0), 0) /
              totalRegistros
            ).toFixed(2)
          )
        : 0;

    ranking.push({
      motoristaId: lista[0].motoristaId,
      motoristaNome: lista[0].motoristaNome,
      totalRegistros,
      totalPacotes,
      totalInsucessos,
      dsMedia,
    });
  });

  return ranking
    .sort((a, b) => b.dsMedia - a.dsMedia)
    .map((item, index) => ({
      ...item,
      posicao: index + 1,
    }));
}