"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

import { listarMetricas } from "@/services/metricaService";
import { gerarRankingPorPeriodo } from "@/services/rankingService";
import ProtectedPage from "@/components/ProtectedPage";

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

  async function exportarExcel() {
    let dados: any[] = [];

    if (tipo === "geral") {
      dados = metricas.map((item) => ({
        Data: item.data,
        Motorista: item.motoristaNome,
        Gaiola: item.codigoGaiola,
        Pacotes: item.qtdPacotesTotal,
        Insucessos: item.qtdPacotesNaoEntregues,
        DS: `${item.ds}%`,
        Motivo: item.motivoNaoEntrega,
      }));
    }

    if (tipo === "ranking") {
      const ranking =
        await gerarRankingPorPeriodo("mes");

      dados = ranking.map((item, index) => ({
        Posicao: index + 1,
        Motorista: item.motoristaNome,
        DS: `${item.dsMedia}%`,
        Pacotes: item.totalPacotes,
        Insucessos: item.totalInsucessos,
        Registros: item.registros,
      }));
    }

    const worksheet =
      XLSX.utils.json_to_sheet(dados);

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Relatorio"
    );

    XLSX.writeFile(
      workbook,
      `relatorio-${tipo}.xlsx`
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
                onChange={(e) =>
                  setTipo(e.target.value)
                }
                className="w-full p-3 rounded text-black"
              >
                <option value="geral">
                  Relatório Geral
                </option>

                <option value="ranking">
                  Ranking Mensal
                </option>
              </select>
            </div>

            <button
              onClick={exportarExcel}
              className="bg-green-600 text-white font-bold px-6 py-3 rounded"
            >
              Exportar Excel
            </button>
          </div>

          <div className="bg-zinc-900 rounded p-6">
            <h2 className="text-yellow-400 text-xl font-bold mb-4">
              Pré-visualização
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
                    {item.data} • DS {item.ds}%
                  </p>

                  <p className="text-zinc-500 text-sm">
                    Pacotes: {item.qtdPacotesTotal} |
                    Insucessos:{" "}
                    {item.qtdPacotesNaoEntregues}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  </ProtectedPage>
);
}