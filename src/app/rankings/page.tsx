"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BarChart3,
  CalendarDays,
  Crown,
  Medal,
  PackageCheck,
  RotateCcw,
  Trophy,
} from "lucide-react";

import PageShell from "@/components/layout/pageshell";
import PremiumCard from "@/components/ui/premiumCard";

import { useBase } from "@/contexts/BaseContext";
import {
  gerarRankingPorPeriodo,
  type RankingItem,
} from "@/services/rankingService";

type Periodo = "dia" | "semana" | "mes";

function corDS(ds: number) {
  if (ds >= 98) return "text-emerald-400";
  if (ds >= 95) return "text-yellow-400";
  return "text-red-400";
}

function medalha(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `#${index + 1}`;
}

export default function RankingsPage() {
  const { baseAtual } = useBase();
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("dia");

  useEffect(() => {
    let ativo = true;

    const carregamento = baseAtual
      ? gerarRankingPorPeriodo(periodo, baseAtual)
      : Promise.resolve<RankingItem[]>([]);

    carregamento.then((data) => {
      if (ativo) {
        setRanking(data);
      }
    });

    return () => {
      ativo = false;
    };
  }, [baseAtual, periodo]);

  const primeiro = ranking[0];

  return (
    <PageShell
      title="Ranking DS"
      subtitle="Classificação de motoristas por performance operacional."
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <PremiumCard className="xl:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
                <Trophy size={23} className="text-yellow-400" />
              </div>

              <div>
                <h2 className="text-white text-2xl font-black">
                  Período do ranking
                </h2>

                <p className="text-zinc-500 text-sm">
                  Escolha o intervalo para calcular a média DS.
                </p>
              </div>
            </div>

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as Periodo)}
              className="w-full md:w-64 p-4 rounded-2xl bg-black border border-zinc-800 text-white outline-none focus:border-yellow-400 transition"
            >
              <option value="dia">Ranking do Dia</option>
              <option value="semana">Ranking Semanal</option>
              <option value="mes">Ranking Mensal</option>
            </select>
          </div>
        </PremiumCard>

        <PremiumCard>
          <div className="flex items-center gap-3 mb-4">
            <CalendarDays size={22} className="text-yellow-400" />

            <h2 className="text-white text-2xl font-black">
              Registros
            </h2>
          </div>

          <p className="text-zinc-500 text-sm">
            Motoristas no ranking
          </p>

          <p className="text-yellow-400 text-5xl font-black mt-3">
            {ranking.length}
          </p>
        </PremiumCard>
      </div>

      {primeiro && (
        <div className="mb-6">
          <div className="relative overflow-hidden rounded-3xl border border-yellow-400/80 bg-gradient-to-br from-yellow-400/15 via-zinc-950 to-black p-7 shadow-2xl shadow-yellow-400/10">
            <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-yellow-400/20 blur-3xl" />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-3xl bg-yellow-400 text-black flex items-center justify-center shadow-lg shadow-yellow-400/20">
                  <Crown size={32} />
                </div>

                <div>
                  <p className="text-yellow-400 uppercase tracking-[0.25em] text-xs font-bold">
                    Líder do período
                  </p>

                  <h2 className="text-white text-3xl md:text-4xl font-black mt-1">
                    {primeiro.motoristaNome}
                  </h2>

                  <p className="text-zinc-400 mt-1">
                    {primeiro.registros} registros • {primeiro.totalPacotes} pacotes •{" "}
                    {primeiro.totalInsucessos} insucessos
                  </p>
                </div>
              </div>

              <div className={`text-6xl font-black ${corDS(primeiro.dsMedia)}`}>
                {primeiro.dsMedia}%
              </div>
            </div>
          </div>
        </div>
      )}

      <PremiumCard>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white text-3xl font-black">
              Classificação
            </h2>

            <p className="text-zinc-500 text-sm mt-1">
              Ranking calculado automaticamente pelo DS médio.
            </p>
          </div>

          <BarChart3 className="text-yellow-400" size={28} />
        </div>

        <div className="space-y-4">
          {ranking.map((item, index) => (
            <div
              key={index}
              className={`
                rounded-3xl border p-5 transition hover:-translate-y-1
                ${
                  index === 0
                    ? "bg-gradient-to-br from-yellow-400/10 via-black to-zinc-950 border-yellow-400/70 shadow-xl shadow-yellow-400/10"
                    : "bg-black border-zinc-800 hover:border-yellow-400/40"
                }
              `}
            >
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div
                    className={`
                      h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg
                      ${
                        index === 0
                          ? "bg-yellow-400 text-black"
                          : "bg-zinc-900 text-yellow-400 border border-zinc-800"
                      }
                    `}
                  >
                    {medalha(index)}
                  </div>

                  <div>
                    <h3 className="text-white text-2xl font-black">
                      {item.motoristaNome}
                    </h3>

                    <p className="text-zinc-500 text-sm mt-1">
                      Registros: {item.registros} • Pacotes: {item.totalPacotes} •
                      Insucessos: {item.totalInsucessos}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="hidden md:grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3 min-w-24">
                      <PackageCheck size={16} className="text-yellow-400 mb-1" />
                      <p className="text-zinc-500 text-xs">Pacotes</p>
                      <p className="text-white font-black">
                        {item.totalPacotes}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3 min-w-24">
                      <RotateCcw size={16} className="text-red-400 mb-1" />
                      <p className="text-zinc-500 text-xs">Ins.</p>
                      <p className="text-red-400 font-black">
                        {item.totalInsucessos}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3 min-w-24">
                      <Medal size={16} className="text-yellow-400 mb-1" />
                      <p className="text-zinc-500 text-xs">Reg.</p>
                      <p className="text-white font-black">
                        {item.registros}
                      </p>
                    </div>
                  </div>

                  <div className={`text-5xl font-black ${corDS(item.dsMedia)}`}>
                    {item.dsMedia}%
                  </div>
                </div>
              </div>
            </div>
          ))}

          {ranking.length === 0 && (
            <div className="rounded-3xl bg-black border border-zinc-800 p-12 text-center">
              <Award className="mx-auto text-zinc-600 mb-4" size={40} />

              <p className="text-zinc-400 text-xl">
                Nenhuma métrica encontrada para este período.
              </p>
            </div>
          )}
        </div>
      </PremiumCard>
    </PageShell>
  );
}
