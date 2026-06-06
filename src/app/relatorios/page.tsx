"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { listarMetricas } from "@/services/metricaService";
import { gerarRankingGeral } from "@/services/rankingService";

export default function RelatoriosPage() {
  const [tipo, setTipo] = useState("geral");
  const [metricas, setMetricas] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);

  async function carregarDados() {
    const metricasData = await listarMetricas();
    const rankingData = await gerarRankingGeral();

    setMetricas(metricasData as any[]);
    setRanking(rankingData as any[]);
  }

  function gerarPDF() {
    const pdf = new jsPDF();

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

    pdf.setFontSize(18);
    pdf.text("GESTÃO INTERNA EMPRESA ALTO VALE", 14, 20);

    pdf.setFontSize(11);
    pdf.text(`Tipo de relatório: ${tipo.toUpperCase()}`, 14, 32);
    pdf.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 40);

    pdf.setFontSize(13);
    pdf.text("Resumo Operacional", 14, 55);

    autoTable(pdf, {
      startY: 62,
      head: [["Indicador", "Valor"]],
      body: [
        ["Total de registros", String(metricas.length)],
        ["Total de pacotes", String(totalPacotes)],
        ["Total de insucessos", String(totalInsucessos)],
        ["DS média", `${dsMedia}%`],
        ["Melhor motorista", ranking[0]?.motoristaNome || "-"],
        ["Melhor DS", `${ranking[0]?.dsMedia || 0}%`],
      ],
    });

    autoTable(pdf, {
      startY: (pdf as any).lastAutoTable.finalY + 15,
      head: [["#", "Motorista", "DS média", "Pacotes", "Insucessos"]],
      body: ranking.map((item) => [
        item.posicao,
        item.motoristaNome,
        `${item.dsMedia}%`,
        item.totalPacotes,
        item.totalInsucessos,
      ]),
    });

    autoTable(pdf, {
      startY: (pdf as any).lastAutoTable.finalY + 15,
      head: [["Data", "Motorista", "Gaiola", "Pacotes", "Insucessos", "DS"]],
      body: metricas.map((item) => [
        item.data,
        item.motoristaNome,
        item.codigoGaiola,
        item.qtdPacotesTotal,
        item.qtdPacotesNaoEntregues,
        `${item.ds}%`,
      ]),
    });

    pdf.save(`relatorio-${tipo}-alto-vale.pdf`);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <main className="p-6 bg-zinc-950 min-h-screen">
          <h1 className="text-3xl text-yellow-400 font-bold mb-6">
            Relatórios PDF
          </h1>

          <div className="bg-zinc-900 p-6 rounded max-w-xl">
            <label className="text-white block mb-2">
              Tipo de relatório
            </label>

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-3 rounded text-black mb-4"
            >
              <option value="geral">Geral</option>
              <option value="diario">Diário</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>

            <button
              onClick={gerarPDF}
              className="bg-yellow-400 text-black font-bold px-6 py-3 rounded"
            >
              Gerar PDF
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}