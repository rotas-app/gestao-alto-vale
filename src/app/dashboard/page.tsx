"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

import { listarMotoristas } from "@/services/motoristaService";
import { listarMetricas } from "@/services/metricaService";
import { gerarRankingGeral } from "@/services/rankingService";

interface DashboardData {
  totalMotoristas: number;
  totalMetricas: number;
  totalPacotes: number;
  totalInsucessos: number;
  dsMedia: number;
  melhorMotorista: string;
  melhorDS: number;
}

function corDS(ds: number) {
  if (ds >= 98) return "text-green-400";
  if (ds >= 95) return "text-yellow-400";
  return "text-red-400";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    totalMotoristas: 0,
    totalMetricas: 0,
    totalPacotes: 0,
    totalInsucessos: 0,
    dsMedia: 0,
    melhorMotorista: "-",
    melhorDS: 0,
  });

  async function carregarDashboard() {
    const motoristas = await listarMotoristas();
    const metricas: any[] = await listarMetricas();
    const ranking = await gerarRankingGeral();

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

    setData({
      totalMotoristas: motoristas.length,
      totalMetricas: metricas.length,
      totalPacotes,
      totalInsucessos,
      dsMedia,
      melhorMotorista: ranking[0]?.motoristaNome || "-",
      melhorDS: ranking[0]?.dsMedia || 0,
    });
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <main className="p-6 bg-zinc-950 min-h-screen">
          <h1 className="text-3xl text-yellow-400 font-bold mb-6">
            Dashboard
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-zinc-900 p-6 rounded border border-zinc-800">
              <p className="text-zinc-400">DS média geral</p>
              <p className={`text-4xl font-bold ${corDS(data.dsMedia)}`}>
                {data.dsMedia}%
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded border border-zinc-800">
              <p className="text-zinc-400">Motoristas</p>
              <p className="text-yellow-400 text-4xl font-bold">
                {data.totalMotoristas}
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded border border-zinc-800">
              <p className="text-zinc-400">Métricas lançadas</p>
              <p className="text-yellow-400 text-4xl font-bold">
                {data.totalMetricas}
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded border border-zinc-800">
              <p className="text-zinc-400">Total de pacotes</p>
              <p className="text-white text-4xl font-bold">
                {data.totalPacotes}
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded border border-zinc-800">
              <p className="text-zinc-400">Total de insucessos</p>
              <p className="text-red-400 text-4xl font-bold">
                {data.totalInsucessos}
              </p>
            </div>

            <div className="bg-zinc-900 p-6 rounded border border-yellow-400">
              <p className="text-zinc-400">Melhor motorista</p>
              <p className="text-white text-xl font-bold">
                {data.melhorMotorista}
              </p>
              <p className={`text-3xl font-bold ${corDS(data.melhorDS)}`}>
                {data.melhorDS}%
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}