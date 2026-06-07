"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  FileText,
  MessageCircle,
  PackageCheck,
  TrendingUp,
  AlertTriangle,
  Route,
} from "lucide-react";

import PageShell from "@/components/layout/pageshell";
import PremiumCard from "@/components/ui/premiumCard";

import { useBase } from "@/contexts/BaseContext";
import type { Metrica } from "@/types/metricas";
import { gerarLinkMercadoLivre } from "@/utils/mercadolivre";
import { listarMetricas } from "@/services/metricaService";
import { gerarRankingPorPeriodo } from "@/services/rankingService";

const NUMERO_WHATSAPP = "5547991232502";

type TipoRelatorio = "geral" | "ranking";
type LinhaExcel = Record<string, string | number>;

export default function RelatoriosPage() {
  const { baseAtual } = useBase();
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [tipo, setTipo] = useState<TipoRelatorio>("geral");

  useEffect(() => {
    let ativo = true;

    const carregamento = baseAtual
      ? listarMetricas(baseAtual)
      : Promise.resolve<Metrica[]>([]);

    carregamento.then((data) => {
      if (ativo) {
        setMetricas(data);
      }
    });

    return () => {
      ativo = false;
    };
  }, [baseAtual]);

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
    let dados: LinhaExcel[] = [];

    if (tipo === "geral") {
      dados = metricas.map((item) => ({
        Data: item.data,
        Motorista: item.motoristaNome,
        ID_Rota: item.idRota || "",
        Link_Mercado_Livre: item.idRota
          ? gerarLinkMercadoLivre(item.idRota)
          : "",
        Rota_Gaiola: item.codigoGaiola || "",
        Pacotes: item.qtdPacotesTotal,
        Insucessos: item.qtdPacotesNaoEntregues,
        DS: `${item.ds}%`,
      }));
    }

    if (tipo === "ranking") {
      if (!baseAtual) {
        alert("Selecione uma base antes de exportar.");
        return;
      }

      const ranking = await gerarRankingPorPeriodo("mes", baseAtual);

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
            item.idRota ? `\n  Link: ${gerarLinkMercadoLivre(item.idRota)}` : ""
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
    <PageShell
      title="Relatórios"
      subtitle="Exportação operacional simples, limpa e comunicativa."
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <PremiumCard className="xl:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
              <FileText size={22} className="text-yellow-400" />
            </div>

            <div>
              <h2 className="text-white text-2xl font-black">
                Gerar relatório
              </h2>

              <p className="text-zinc-500 text-sm">
                Escolha o tipo de relatório e envie ou exporte.
              </p>
            </div>
          </div>

          <label className="text-zinc-400 text-sm block mb-2">
            Tipo de relatório
          </label>

          <select
            value={tipo}
            onChange={(e) =>
              setTipo(e.target.value as TipoRelatorio)
            }
            className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-yellow-400 transition"
          >
            <option value="geral">Relatório Geral</option>
            <option value="ranking">Ranking Mensal</option>
          </select>

          <div className="flex flex-col md:flex-row gap-3 mt-5">
            <button
              onClick={exportarExcel}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-black px-6 py-4 rounded-2xl transition"
            >
              <Download size={18} />
              Exportar Excel
            </button>

            <button
              onClick={enviarWhatsapp}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black px-6 py-4 rounded-2xl transition"
            >
              <MessageCircle size={18} />
              Enviar no WhatsApp
            </button>
          </div>
        </PremiumCard>

        <PremiumCard>
          <div className="flex items-center gap-3 mb-5">
            <Route size={22} className="text-yellow-400" />

            <h2 className="text-white text-2xl font-black">
              Rotas
            </h2>
          </div>

          <p className="text-zinc-500 text-sm">
            Total de métricas listadas
          </p>

          <p className="text-yellow-400 text-5xl font-black mt-3">
            {metricas.length}
          </p>
        </PremiumCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <PremiumCard>
          <PackageCheck className="text-yellow-400 mb-3" />

          <p className="text-zinc-500 text-sm">
            Total de pacotes
          </p>

          <p className="text-white text-4xl font-black mt-2">
            {totalPacotes}
          </p>
        </PremiumCard>

        <PremiumCard>
          <AlertTriangle className="text-red-400 mb-3" />

          <p className="text-zinc-500 text-sm">
            Total de insucessos
          </p>

          <p className="text-red-400 text-4xl font-black mt-2">
            {totalInsucessos}
          </p>
        </PremiumCard>

        <PremiumCard>
          <TrendingUp className="text-yellow-400 mb-3" />

          <p className="text-zinc-500 text-sm">
            DS média
          </p>

          <p className="text-yellow-400 text-4xl font-black mt-2">
            {dsMedia}%
          </p>
        </PremiumCard>
      </div>

      <PremiumCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-3xl font-black">
              Relatório simples por rota
            </h2>

            <p className="text-zinc-500 text-sm mt-1">
              Visualização limpa sem motivo dos insucessos.
            </p>
          </div>

          <FileText className="text-yellow-400" size={28} />
        </div>

        <div className="space-y-4">
          {metricas.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl bg-black border border-zinc-800 p-5 hover:border-yellow-400/40 transition"
            >
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div>
                  <h3 className="text-white text-2xl font-black">
                    {item.motoristaNome}
                  </h3>

                  <p className="text-zinc-400 text-sm mt-2">
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

                  <p className="text-zinc-500 text-sm mt-1">
                    Pacotes: {item.qtdPacotesTotal} | Insucessos:{" "}
                    {item.qtdPacotesNaoEntregues}
                  </p>
                </div>

                <div className="text-yellow-400 text-5xl font-black">
                  {item.ds}%
                </div>
              </div>
            </div>
          ))}

          {metricas.length === 0 && (
            <div className="rounded-3xl bg-black border border-zinc-800 p-10 text-center">
              <p className="text-zinc-500">
                Nenhuma métrica cadastrada.
              </p>
            </div>
          )}
        </div>
      </PremiumCard>
    </PageShell>
  );
}
