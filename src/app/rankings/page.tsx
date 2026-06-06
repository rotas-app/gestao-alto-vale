"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { gerarRankingGeral } from "@/services/rankingService";

interface RankingItem {
  motoristaId: string;
  motoristaNome: string;
  totalRegistros: number;
  totalPacotes: number;
  totalInsucessos: number;
  dsMedia: number;
  posicao: number;
}

function corDS(ds: number) {
  if (ds >= 98) return "text-green-400";
  if (ds >= 95) return "text-yellow-400";
  return "text-red-400";
}

export default function RankingsPage() {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarRanking() {
    setLoading(true);
    const data = await gerarRankingGeral();
    setRanking(data);
    setLoading(false);
  }

  useEffect(() => {
    carregarRanking();
  }, []);

  return (
    <div className="flex flex-col md:flex-row">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <main className="p-6 bg-zinc-950 min-h-screen">
          <h1 className="text-3xl text-yellow-400 font-bold mb-6">
            Ranking DS
          </h1>

          <div className="bg-zinc-900 rounded p-6">
            {loading ? (
              <p className="text-white">Carregando ranking...</p>
            ) : ranking.length === 0 ? (
              <p className="text-white">Nenhuma métrica cadastrada ainda.</p>
            ) : (
              <div className="space-y-3">
                {ranking.map((item) => (
                  <div
                    key={item.motoristaId}
                    className="bg-black border border-zinc-800 rounded p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-bold">
                        {item.posicao}º - {item.motoristaNome}
                      </p>

                      <p className="text-zinc-400 text-sm">
                        Registros: {item.totalRegistros} | Pacotes:{" "}
                        {item.totalPacotes} | Insucessos: {item.totalInsucessos}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`text-3xl font-bold ${corDS(item.dsMedia)}`}>
                        {item.dsMedia}%
                      </p>
                      <p className="text-zinc-400 text-sm">DS média</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}