"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  AlertTriangle,
  Award,
  Boxes,
  ClipboardList,
  PackageCheck,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProtectedPage from "@/components/ProtectedPage";

import { useBase } from "@/contexts/BaseContext";
import { listarMotoristas } from "@/services/motoristaService";
import { listarMetricas } from "@/services/metricaService";
import {
  gerarRankingPorPeriodo,
  type RankingItem,
} from "@/services/rankingService";

interface DashboardData {
  totalMotoristas: number;
  totalMetricas: number;
  totalPacotes: number;
  totalInsucessos: number;
  dsMedia: number;
  melhorMotorista: string;
  melhorDS: number;
  piorMotorista: string;
  piorDS: number;
  metricasCriticas: number;
}

const DASHBOARD_VAZIO: DashboardData = {
  totalMotoristas: 0,
  totalMetricas: 0,
  totalPacotes: 0,
  totalInsucessos: 0,
  dsMedia: 0,
  melhorMotorista: "-",
  melhorDS: 0,
  piorMotorista: "-",
  piorDS: 0,
  metricasCriticas: 0,
};

interface CardProps {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  valueClass?: string;
  highlight?: boolean;
}

function corDS(ds: number) {
  if (ds >= 98) return "text-emerald-400";
  if (ds >= 95) return "text-yellow-400";
  return "text-red-400";
}

function Card({
  title,
  value,
  icon: Icon,
  valueClass = "text-white",
  highlight = false,
}: CardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl border p-6
        bg-gradient-to-br from-zinc-900 via-zinc-950 to-black
        ${highlight ? "border-yellow-400/80 shadow-yellow-400/10" : "border-zinc-800"}
        shadow-2xl transition hover:-translate-y-1 hover:border-yellow-400/60
      `}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-yellow-400/10 blur-2xl" />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-zinc-400 text-sm">{title}</p>
          <p className={`text-4xl font-black mt-2 ${valueClass}`}>
            {value}
          </p>
        </div>

        <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
          <Icon size={23} className="text-yellow-400" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { baseAtual } = useBase();
  const [data, setData] = useState<DashboardData>(DASHBOARD_VAZIO);
  const [ranking, setRanking] = useState<RankingItem[]>([]);

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      if (!baseAtual) {
        return {
          data: DASHBOARD_VAZIO,
          ranking: [],
        };
      }

      const [motoristas, metricas, rankingData] = await Promise.all([
        listarMotoristas(baseAtual),
        listarMetricas(baseAtual),
        gerarRankingPorPeriodo("mes", baseAtual),
      ]);

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
                metricas.reduce(
                  (acc, item) => acc + Number(item.ds || 0),
                  0
                ) / metricas.length
              ).toFixed(2)
            )
          : 0;
      const pior = rankingData.at(-1);

      return {
        ranking: rankingData.slice(0, 5),
        data: {
          totalMotoristas: motoristas.length,
          totalMetricas: metricas.length,
          totalPacotes,
          totalInsucessos,
          dsMedia,
          melhorMotorista: rankingData[0]?.motoristaNome || "-",
          melhorDS: rankingData[0]?.dsMedia || 0,
          piorMotorista: pior?.motoristaNome || "-",
          piorDS: pior?.dsMedia || 0,
          metricasCriticas: metricas.filter(
            (item) => Number(item.ds || 0) < 95
          ).length,
        },
      };
    }

    void carregarDashboard().then((resultado) => {
      if (!ativo) return;

      setData(resultado.data);
      setRanking(resultado.ranking);
    });

    return () => {
      ativo = false;
    };
  }, [baseAtual]);

  const graficoPacotes = [
    {
      nome: "Entregues",
      valor: Math.max(data.totalPacotes - data.totalInsucessos, 0),
    },
    { nome: "Insucessos", valor: data.totalInsucessos },
  ];

  return (
    <ProtectedPage>
      <div className="flex flex-col md:flex-row bg-black">
        <Sidebar />

        <div className="flex-1 min-h-screen">
          <Header />

          <main className="relative p-6 md:p-8 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.10),_transparent_35%),linear-gradient(180deg,#09090b,#050505)] min-h-screen">
            <div className="mb-8">
              <p className="text-zinc-500 uppercase tracking-[0.35em] text-xs">
                Visão Operacional
              </p>

              <h1 className="text-4xl md:text-5xl text-yellow-400 font-black mt-2">
                Dashboard
              </h1>

              <p className="text-zinc-400 mt-2">
                Resumo em tempo real da performance dos motoristas e rotas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <Card
                title="DS média geral"
                value={`${data.dsMedia}%`}
                icon={TrendingUp}
                valueClass={corDS(data.dsMedia)}
              />

              <Card
                title="Motoristas"
                value={data.totalMotoristas}
                icon={Users}
                valueClass="text-yellow-400"
              />

              <Card
                title="Métricas lançadas"
                value={data.totalMetricas}
                icon={ClipboardList}
                valueClass="text-yellow-400"
              />

              <Card
                title="Total de pacotes"
                value={data.totalPacotes}
                icon={Boxes}
                valueClass="text-white"
              />

              <Card
                title="Total de insucessos"
                value={data.totalInsucessos}
                icon={PackageCheck}
                valueClass="text-red-400"
              />

              <div className="relative overflow-hidden rounded-3xl border border-yellow-400/80 p-6 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-2xl shadow-yellow-400/10">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-yellow-400/20 blur-3xl" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-zinc-400 text-sm">Melhor motorista</p>
                    <p className="text-white text-xl font-black mt-2">
                      {data.melhorMotorista}
                    </p>
                    <p className={`text-4xl font-black ${corDS(data.melhorDS)}`}>
                      {data.melhorDS}%
                    </p>
                  </div>

                  <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
                    <Award size={24} className="text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
              <div className="rounded-3xl border border-red-500/70 bg-gradient-to-br from-red-950/90 via-zinc-950 to-black p-6 shadow-2xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={22} className="text-red-400" />
                  <p className="text-red-300 font-black">
                    Alertas DS abaixo de 95%
                  </p>
                </div>

                <p className="text-red-400 text-6xl font-black mt-4">
                  {data.metricasCriticas}
                </p>

                <p className="text-zinc-300 text-sm mt-3">
                  Métricas com desempenho abaixo da meta operacional.
                </p>
              </div>

              <div className="rounded-3xl border border-red-500/70 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 shadow-2xl">
                <p className="text-zinc-400">Pior DS médio</p>

                <p className="text-white text-2xl font-black mt-2">
                  {data.piorMotorista}
                </p>

                <p className="text-red-400 text-5xl font-black">
                  {data.piorDS}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-yellow-400 text-2xl font-black">
                      Top 5 DS
                    </h2>
                    <p className="text-zinc-500 text-sm">
                      Melhores médias do mês
                    </p>
                  </div>

                  <Truck className="text-yellow-400" size={26} />
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ranking}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis dataKey="motoristaNome" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <Tooltip
                        contentStyle={{
                          background: "#09090b",
                          border: "1px solid #3f3f46",
                          borderRadius: "14px",
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="dsMedia"
                        fill="#facc15"
                        radius={[12, 12, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 shadow-2xl">
                <h2 className="text-yellow-400 text-2xl font-black mb-1">
                  Entregas
                </h2>

                <p className="text-zinc-500 text-sm mb-6">
                  Pacotes entregues x insucessos
                </p>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={graficoPacotes}
                        dataKey="valor"
                        nameKey="nome"
                        innerRadius={65}
                        outerRadius={110}
                        paddingAngle={4}
                      >
                        <Cell fill="#facc15" />
                        <Cell fill="#ef4444" />
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background: "#09090b",
                          border: "1px solid #3f3f46",
                          borderRadius: "14px",
                          color: "#fff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-2xl bg-black border border-zinc-800 p-3">
                    <p className="text-zinc-500 text-xs">Entregues</p>
                    <p className="text-yellow-400 font-black">
                      {Math.max(data.totalPacotes - data.totalInsucessos, 0)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-black border border-zinc-800 p-3">
                    <p className="text-zinc-500 text-xs">Insucessos</p>
                    <p className="text-red-400 font-black">
                      {data.totalInsucessos}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}
