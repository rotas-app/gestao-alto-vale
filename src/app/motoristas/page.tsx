"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

import {
  criarMotorista,
  excluirMotorista,
  listarMotoristas,
} from "@/services/motoristaService";

import { listarMetricas } from "@/services/metricaService";

export default function MotoristasPage() {
  const [nome, setNome] = useState("");
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  async function carregarDados() {
    const motoristasData = await listarMotoristas();
    const metricasData = await listarMetricas();

    setMotoristas(motoristasData);
    setMetricas(metricasData as any[]);
  }

  async function handleCriar() {
    if (!nome) return;

    await criarMotorista(nome);

    setNome("");
    carregarDados();
  }

  async function handleExcluir(id: string) {
    const confirmar = confirm("Deseja realmente excluir este motorista?");

    if (!confirmar) return;

    await excluirMotorista(id);

    carregarDados();
  }

  function metricasDoMotorista(id: string) {
    return metricas.filter((item) => item.motoristaId === id);
  }

  function resumoMotorista(id: string) {
    const lista = metricasDoMotorista(id);

    const totalPacotes = lista.reduce(
      (acc, item) => acc + Number(item.qtdPacotesTotal || 0),
      0
    );

    const totalInsucessos = lista.reduce(
      (acc, item) => acc + Number(item.qtdPacotesNaoEntregues || 0),
      0
    );

    const dsMedia =
      lista.length > 0
        ? Number(
            (
              lista.reduce((acc, item) => acc + Number(item.ds || 0), 0) /
              lista.length
            ).toFixed(2)
          )
        : 0;

    return {
      totalPacotes,
      totalInsucessos,
      dsMedia,
      totalRegistros: lista.length,
    };
  }

  function corDS(ds: number) {
    if (ds >= 98) return "text-green-400";
    if (ds >= 95) return "text-yellow-400";
    return "text-red-400";
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const filtrados = motoristas.filter((m) =>
    m.nomeCompleto?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <main className="p-6 bg-zinc-950 min-h-screen">
          <h1 className="text-3xl text-yellow-400 font-bold mb-6">
            Motoristas
          </h1>

          <div className="bg-zinc-900 p-4 rounded mb-6">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              className="w-full p-3 rounded text-black mb-4"
            />

            <button
              onClick={handleCriar}
              className="bg-yellow-400 text-black font-bold px-6 py-3 rounded"
            >
              Cadastrar Motorista
            </button>
          </div>

          <div className="bg-zinc-900 p-4 rounded mb-6">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar motorista..."
              className="w-full p-3 rounded text-black"
            />
          </div>

          <div className="space-y-4">
            {filtrados.map((motorista) => {
              const resumo = resumoMotorista(motorista.id);
              const historico = metricasDoMotorista(motorista.id);

              return (
                <details key={motorista.id} className="bg-zinc-900 rounded">
                  <summary className="cursor-pointer p-4 text-white font-bold">
                    {motorista.nomeCompleto}
                  </summary>

                  <div className="p-4 border-t border-zinc-700 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="bg-black p-4 rounded">
                        <p className="text-zinc-400 text-sm">DS média</p>
                        <p className={`text-2xl font-bold ${corDS(resumo.dsMedia)}`}>
                          {resumo.dsMedia}%
                        </p>
                      </div>

                      <div className="bg-black p-4 rounded">
                        <p className="text-zinc-400 text-sm">Pacotes</p>
                        <p className="text-yellow-400 text-2xl font-bold">
                          {resumo.totalPacotes}
                        </p>
                      </div>

                      <div className="bg-black p-4 rounded">
                        <p className="text-zinc-400 text-sm">Insucessos</p>
                        <p className="text-red-400 text-2xl font-bold">
                          {resumo.totalInsucessos}
                        </p>
                      </div>

                      <div className="bg-black p-4 rounded">
                        <p className="text-zinc-400 text-sm">Registros</p>
                        <p className="text-white text-2xl font-bold">
                          {resumo.totalRegistros}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-yellow-400 font-bold mb-2">
                        Histórico
                      </h3>

                      <div className="space-y-2">
                        {historico.map((item) => (
                          <div
                            key={item.id}
                            className="bg-black rounded p-3 border border-zinc-800"
                          >
                            <p className="text-white font-bold">
                              {item.data} — DS {item.ds}%
                            </p>

                            <p className="text-zinc-400 text-sm">
                              Gaiola: {item.codigoGaiola || "-"} | Pacotes:{" "}
                              {item.qtdPacotesTotal} | Insucessos:{" "}
                              {item.qtdPacotesNaoEntregues}
                            </p>

                            <p className="text-zinc-500 text-sm">
                              Motivo: {item.motivoNaoEntrega || "-"}
                            </p>
                          </div>
                        ))}

                        {historico.length === 0 && (
                          <p className="text-zinc-400">
                            Nenhuma métrica cadastrada para este motorista.
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleExcluir(motorista.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      Excluir Motorista
                    </button>
                  </div>
                </details>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}