"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Pencil,
  Trash2,
  Truck,
  UserPlus,
} from "lucide-react";

import PageShell from "@/components/layout/pageshell";
import PremiumCard from "@/components/ui/premiumCard";

import { useBase } from "@/contexts/BaseContext";
import type { Metrica } from "@/types/metricas";
import type { Motorista } from "@/types/motorista";
import { gerarLinkMercadoLivre } from "@/utils/mercadolivre";

import {
  criarMotorista,
  editarMotorista,
  excluirMotorista,
  listarMotoristas,
} from "@/services/motoristaService";

import { listarMetricas } from "@/services/metricaService";

export default function MotoristasPage() {
  const { baseAtual } = useBase();

  const [nome, setNome] = useState("");
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [busca, setBusca] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeEditando, setNomeEditando] = useState("");
  const [observacaoEditando, setObservacaoEditando] = useState("");

  async function carregarDados() {
    if (!baseAtual) return;

    const [motoristasData, metricasData] = await Promise.all([
      listarMotoristas(baseAtual),
      listarMetricas(baseAtual),
    ]);

    setMotoristas(motoristasData);
    setMetricas(metricasData);
  }

  async function handleCriar() {
    if (!nome) return;

    if (!baseAtual) {
      alert("Selecione uma base antes de cadastrar motorista");
      return;
    }

    await criarMotorista(nome, baseAtual);

    setNome("");
    await carregarDados();
  }

  async function handleExcluir(id: string) {
    const confirmar = confirm("Deseja realmente excluir este motorista?");

    if (!confirmar) return;

    await excluirMotorista(id);

    await carregarDados();
  }

  function iniciarEdicao(motorista: Motorista) {
    setEditandoId(motorista.id);
    setNomeEditando(motorista.nomeCompleto || "");
    setObservacaoEditando(motorista.observacao || "");
  }

  async function salvarEdicao() {
    if (!editandoId) return;

    await editarMotorista(editandoId, {
      nomeCompleto: nomeEditando,
      observacao: observacaoEditando,
    });

    setEditandoId(null);
    setNomeEditando("");
    setObservacaoEditando("");

    await carregarDados();

    alert("Motorista atualizado");
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setNomeEditando("");
    setObservacaoEditando("");
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
    if (ds >= 98) return "text-emerald-400";
    if (ds >= 95) return "text-yellow-400";
    return "text-red-400";
  }

  useEffect(() => {
    let ativo = true;

    const carregamento = baseAtual
      ? Promise.all([
          listarMotoristas(baseAtual),
          listarMetricas(baseAtual),
        ])
      : Promise.resolve<[Motorista[], Metrica[]]>([[], []]);

    carregamento.then(([motoristasData, metricasData]) => {
      if (!ativo) return;

      setMotoristas(motoristasData);
      setMetricas(metricasData);
    });

    return () => {
      ativo = false;
    };
  }, [baseAtual]);

  const filtrados = motoristas.filter((m) =>
    m.nomeCompleto?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <PageShell
      title="Motoristas"
      subtitle="Controle operacional e histórico completo de performance."
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <PremiumCard className="xl:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center">
              <UserPlus size={22} className="text-yellow-400" />
            </div>

            <div>
              <h2 className="text-white text-2xl font-black">
                Novo Motorista
              </h2>

              <p className="text-zinc-500 text-sm">
                Cadastro operacional de motorista.
              </p>
            </div>
          </div>

          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome completo"
            className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white placeholder:text-zinc-500 outline-none focus:border-yellow-400 transition"
          />

          <button
            onClick={handleCriar}
            className="mt-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black px-6 py-4 rounded-2xl transition shadow-lg shadow-yellow-400/20"
          >
            Cadastrar Motorista
          </button>
        </PremiumCard>

        <PremiumCard>
          <div className="flex items-center gap-3 mb-5">
            <Activity className="text-yellow-400" size={22} />

            <h2 className="text-white text-2xl font-black">
              Buscar
            </h2>
          </div>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar motorista..."
            className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white placeholder:text-zinc-500 outline-none focus:border-yellow-400 transition"
          />
        </PremiumCard>
      </div>

      <div className="space-y-5">
        {filtrados.map((motorista) => {
          const resumo = resumoMotorista(motorista.id);
          const historico = metricasDoMotorista(motorista.id);

          return (
            <details key={motorista.id} className="group">
              <summary className="list-none cursor-pointer">
                <PremiumCard className="hover:border-yellow-400/40 transition">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                      <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs">
                        Motorista
                      </p>

                      <h2 className="text-white text-3xl font-black mt-2">
                        {motorista.nomeCompleto}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-2xl bg-black border border-zinc-800 p-4">
                        <p className="text-zinc-500 text-xs">DS média</p>

                        <p
                          className={`text-2xl font-black mt-1 ${corDS(
                            resumo.dsMedia
                          )}`}
                        >
                          {resumo.dsMedia}%
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black border border-zinc-800 p-4">
                        <p className="text-zinc-500 text-xs">Pacotes</p>

                        <p className="text-yellow-400 text-2xl font-black mt-1">
                          {resumo.totalPacotes}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black border border-zinc-800 p-4">
                        <p className="text-zinc-500 text-xs">Insucessos</p>

                        <p className="text-red-400 text-2xl font-black mt-1">
                          {resumo.totalInsucessos}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-black border border-zinc-800 p-4">
                        <p className="text-zinc-500 text-xs">Registros</p>

                        <p className="text-white text-2xl font-black mt-1">
                          {resumo.totalRegistros}
                        </p>
                      </div>
                    </div>
                  </div>
                </PremiumCard>
              </summary>

              <div className="mt-4 space-y-4">
                <PremiumCard>
                  {editandoId === motorista.id ? (
                    <div className="space-y-4">
                      <input
                        value={nomeEditando}
                        onChange={(e) => setNomeEditando(e.target.value)}
                        className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white"
                        placeholder="Nome completo"
                      />

                      <textarea
                        value={observacaoEditando}
                        onChange={(e) =>
                          setObservacaoEditando(e.target.value)
                        }
                        className="w-full p-4 rounded-2xl bg-black border border-zinc-800 text-white"
                        placeholder="Observações"
                      />

                      <div className="flex gap-3">
                        <button
                          onClick={salvarEdicao}
                          className="bg-yellow-400 text-black font-black px-5 py-3 rounded-2xl"
                        >
                          Salvar
                        </button>

                        <button
                          onClick={cancelarEdicao}
                          className="bg-zinc-800 text-white font-black px-5 py-3 rounded-2xl"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-zinc-500 text-sm uppercase tracking-[0.2em]">
                        Observações
                      </p>

                      <p className="text-white mt-2">
                        {motorista.observacao ||
                          "Sem observações cadastradas."}
                      </p>
                    </>
                  )}
                </PremiumCard>

                <PremiumCard>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-white text-2xl font-black">
                        Histórico
                      </h3>

                      <p className="text-zinc-500 text-sm">
                        Rotas registradas para este motorista.
                      </p>
                    </div>

                    <Truck className="text-yellow-400" size={24} />
                  </div>

                  <div className="space-y-3">
                    {historico.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-black border border-zinc-800 p-5"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div>
                            <p className="text-white font-black text-lg">
                              {item.data} — DS {item.ds}%
                            </p>

                            <p className="text-zinc-400 text-sm mt-2">
                              ID Rota:{" "}
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
                              | Gaiola: {item.codigoGaiola || "-"}
                            </p>

                            <p className="text-zinc-500 text-sm mt-1">
                              Pacotes: {item.qtdPacotesTotal} | Insucessos:{" "}
                              {item.qtdPacotesNaoEntregues}
                            </p>

                            <p className="text-zinc-600 text-sm mt-1">
                              Motivo: {item.motivoNaoEntrega || "-"}
                            </p>
                          </div>

                          <div className={`text-4xl font-black ${corDS(item.ds)}`}>
                            {item.ds}%
                          </div>
                        </div>
                      </div>
                    ))}

                    {historico.length === 0 && (
                      <div className="rounded-2xl bg-black border border-zinc-800 p-6 text-center">
                        <AlertTriangle className="mx-auto text-zinc-600 mb-3" />

                        <p className="text-zinc-400">
                          Nenhuma métrica cadastrada para este motorista.
                        </p>
                      </div>
                    )}
                  </div>
                </PremiumCard>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => iniciarEdicao(motorista)}
                    className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black px-5 py-3 rounded-2xl transition"
                  >
                    <Pencil size={18} />
                    Editar Motorista
                  </button>

                  <button
                    onClick={() => handleExcluir(motorista.id)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black px-5 py-3 rounded-2xl transition"
                  >
                    <Trash2 size={18} />
                    Excluir Motorista
                  </button>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </PageShell>
  );
}
