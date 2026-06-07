"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProtectedPage from "@/components/ProtectedPage";

import { gerarLinkMercadoLivre } from "@/utils/mercadolivre";
import { listarMetricas } from "@/services/metricaService";
import { gerarRankingPorPeriodo } from "@/services/rankingService";

const NUMERO_WHATSAPP = "5547991232502";

export default function RelatoriosPage() {
  const [metricas, setMetricas] = useState<any[]>([]);
  const [tipo, setTipo] = useState("geral");

  async function carregarDados() {
    const data = await listarMetricas();
    setMetricas(data as any[]);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const totalPacotes = metricas.reduce(
    (acc, item) => acc + Number(item.qtdPacotesTotal || 0),
    0
  );

  const totalInsucessos = metricas.reduce(
    (acc, item) => acc + Number(item.qtdPacotesNaoEntregues || 0),
    0
  );

  const dsMedia =
    metricas.length > 0
      ? Number(
          (
            metricas.reduce((acc, item) => acc + Number(item.ds || 0), 0) /
            metricas.length
          ).toFixed(2)
        )
      : 0;

  async function exportarExcel() {
    let dados: any[] = [];

    if (tipo === "geral") {
      dados = metricas.map((item) => ({
        Data: item.data,
        Motorista: item.motoristaNome,
        ID_Rota: item.idRota,
        Link_Mercado_Livre: item.idRota
          ? gerarLinkMercadoLivre(item.idRota)
          : "",
        Rota_Gaiola: item.codigoGaiola,
        Pacotes: item.qtdPacotesTotal,
        Insucessos: item.qtdPacotesNaoEntregues,
        DS: `${item.ds}%`,
      }));
    }

    if (tipo === "ranking") {
      const ranking = await gerarRankingPorPeriodo("mes");

      dados = ranking.map((item, index) => ({
        Posicao: index + 1,
        Motorista: item.motoristaNome,
        DS: `${item.dsMedia}%`,
        Pacotes: item.totalPacotes,
        Insucessos: item.totalInsucessos,
        Registros: item.registros,
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");

    XLSX.writeFile(workbook, `relatorio-${tipo}.xlsx`);
  }

  function gerarMensagemWhatsapp() {
    const linhas = metricas
      .slice(0, 20)
      .map(
        (item) =>
          `• ${item.motoristaNome} | ID ${item.idRota || "-"} | Gaiola ${
            item.codigoGaiola || "-"
          } | DS ${item.ds}% | ${item.qtdPacotesTotal} pct | ${
            item.qtdPacotesNaoEntregues
          } ins.${
            item.idRota
              ? `\n  Link: ${gerarLinkMercadoLivre(item.idRota)}`
              : ""
          }`
      )
      .join("\n");

    return `RELATÓRIO ALTO VALE

Resumo:
Pacotes: ${totalPacotes}
Insucessos: ${totalInsucessos}
DS média: ${dsMedia}%

Métricas por rota:
${linhas}`;
  }

  function enviarWhatsapp() {
    if (!NUMERO_WHATSAPP) {
      alert("Configure o número do WhatsApp.");
      return;
    }

    const mensagem = encodeURIComponent(gerarMensagemWhatsapp());

    window.open(
      `https://wa.me/${NUMERO_WHATSAPP}?text=${mensagem}`,
      "_blank"
    );
  }

  return (
    <ProtectedPage>
      <div className="flex flex-col md:flex-row">
        <Sidebar />

        <div className="flex-1">
          <Header />

          <main className="p-6 bg-zinc-950 min-h-screen">
            <h1 className="text-3xl text-yellow-400 font-bold mb-6">
              Relatórios
            </h1>

            <div className="bg-zinc-900 rounded p-6 mb-6 space-y-4">
              <div>
                <label className="text-white block mb-2">
                  Tipo de relatório
                </label>

                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700"
                >
                  <option value="geral">Relatório Geral</option>
                  <option value="ranking">Ranking Mensal</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-black rounded p-4 border border-zinc-800">
                  <p className="text-zinc-400 text-sm">Pacotes</p>
                  <p className="text-white text-2xl font-bold">
                    {totalPacotes}
                  </p>
                </div>

                <div className="bg-black rounded p-4 border border-zinc-800">
                  <p className="text-zinc-400 text-sm">Insucessos</p>
                  <p className="text-red-400 text-2xl font-bold">
                    {totalInsucessos}
                  </p>
                </div>

                <div className="bg-black rounded p-4 border border-zinc-800">
                  <p className="text-zinc-400 text-sm">DS média</p>
                  <p className="text-yellow-400 text-2xl font-bold">
                    {dsMedia}%
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <button
                  onClick={exportarExcel}
                  className="bg-green-600 text-white font-bold px-6 py-3 rounded"
                >
                  Exportar Excel
                </button>

                <button
                  onClick={enviarWhatsapp}
                  className="bg-emerald-500 text-white font-bold px-6 py-3 rounded"
                >
                  Enviar relatório no WhatsApp
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 rounded p-6">
              <h2 className="text-yellow-400 text-xl font-bold mb-4">
                Relatório simples por rota
              </h2>

              <div className="space-y-3">
                {metricas.map((item) => (
                  <div
                    key={item.id}
                    className="bg-black border border-zinc-800 rounded p-4"
                  >
                    <p className="text-white font-bold">
                      {item.motoristaNome}
                    </p>

                    <p className="text-zinc-400 text-sm">
                      {item.data} • ID Rota:{" "}
                      {item.idRota ? (
                        <a
                          href={gerarLinkMercadoLivre(item.idRota)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-400 underline font-bold"
                        >
                          {item.idRota}
                        </a>
                      ) : (
                        "-"
                      )}{" "}
                      • Gaiola: {item.codigoGaiola || "-"}
                    </p>

                    <p className="text-zinc-500 text-sm">
                      Pacotes: {item.qtdPacotesTotal} | Insucessos:{" "}
                      {item.qtdPacotesNaoEntregues} | DS:{" "}
                      <span className="text-yellow-400 font-bold">
                        {item.ds}%
                      </span>
                    </p>
                  </div>
                ))}

                {metricas.length === 0 && (
                  <p className="text-zinc-400">
                    Nenhuma métrica cadastrada.
                  </p>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}
