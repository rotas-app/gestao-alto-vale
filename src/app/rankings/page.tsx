"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

import {
  gerarRankingPorPeriodo,
} from "@/services/rankingService";

function corDS(ds: number) {
  if (ds >= 98) return "text-green-400";
  if (ds >= 95) return "text-yellow-400";
  return "text-red-400";
}

export default function RankingsPage() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState<
    "dia" | "semana" | "mes"
  >("dia");

  async function carregarRanking() {
    const data =
      await gerarRankingPorPeriodo(periodo);

    setRanking(data);
  }

  useEffect(() => {
    carregarRanking();
  }, [periodo]);

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <main className="p-6 bg-zinc-950 min-h-screen">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-3xl text-yellow-400 font-bold">
              Ranking DS
            </h1>

            <select
              value={periodo}
              onChange={(e) =>
                setPeriodo(
                  e.target.value as any
                )
              }
              className="bg-zinc-900 border border-zinc-700 text-white p-3 rounded"
            >
              <option value="dia">
                Ranking do Dia
              </option>

              <option value="semana">
                Ranking Semanal
              </option>

              <option value="mes">
                Ranking Mensal
              </option>
            </select>
          </div>

          <div className="bg-zinc-900 rounded p-4 space-y-4">
            {ranking.map((item, index) => (
              <div
                key={index}
                className="bg-black border border-zinc-800 rounded p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-white text-xl font-bold">
                    #{index + 1} • {item.motoristaNome}
                  </p>

                  <p className="text-zinc-400 text-sm">
                    Registros: {item.registros} |
                    Pacotes: {item.totalPacotes} |
                    Insucessos:{" "}
                    {item.totalInsucessos}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`text-5xl font-bold ${corDS(
                      item.dsMedia
                    )}`}
                  >
                    {item.dsMedia}%
                  </p>

                  <p className="text-zinc-500 text-sm">
                    DS média
                  </p>
                </div>
              </div>
            ))}

            {ranking.length === 0 && (
              <div className="text-center py-20">
                <p className="text-zinc-400 text-xl">
                  Nenhuma métrica encontrada.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}