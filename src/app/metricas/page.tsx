"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProtectedPage from "@/components/ProtectedPage";

import { gerarLinkMercadoLivre } from "@/utils/mercadolivre";
import { listarMotoristas } from "@/services/motoristaService";

import {
  criarMetrica,
  editarMetrica,
  excluirMetrica,
  listarMetricas,
} from "@/services/metricaService";

import { calcularDS } from "@/utils/calcDS";

export default function MetricasPage() {
  const [motoristas, setMotoristas] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);

  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [motoristaId, setMotoristaId] = useState("");
  const [motoristaNome, setMotoristaNome] = useState("");
  const [data, setData] = useState("");
  const [codigoGaiola, setCodigoGaiola] = useState("");
  const [idRota, setIdRota] = useState("");
  const [total, setTotal] = useState("");
  const [insucesso, setInsucesso] = useState("");
  const [motivo, setMotivo] = useState("");

  const ds = calcularDS(Number(total), Number(insucesso));

  async function carregarDados() {
    const motoristasData = await listarMotoristas();
    const metricasData = await listarMetricas();

    setMotoristas(motoristasData);
    setMetricas(metricasData as any[]);
  }

  function limparFormulario() {
    setEditandoId(null);
    setMotoristaId("");
    setMotoristaNome("");
    setData("");
    setCodigoGaiola("");
    setIdRota("");
    setTotal("");
    setInsucesso("");
    setMotivo("");
  }

  async function handleSalvar() {
    if (!motoristaId || !data || !idRota || !codigoGaiola || !total) {
      alert(
        "Preencha motorista, data, ID da rota, código da gaiola e total de pacotes"
      );
      return;
    }

    const payload = {
      motoristaId,
      motoristaNome,
      data,
      codigoGaiola,
      idRota,
      qtdPacotesTotal: Number(total),
      qtdPacotesNaoEntregues: Number(insucesso),
      motivoNaoEntrega: motivo,
      ds,
      updatedAt: new Date(),
    };

    if (editandoId) {
      await editarMetrica(editandoId, payload);
      alert("Métrica atualizada");
    } else {
      await criarMetrica({
        ...payload,
        createdAt: new Date(),
      });
      alert("Métrica salva");
    }

    limparFormulario();
    carregarDados();
  }

  function handleEditar(metrica: any) {
    setEditandoId(metrica.id);
    setMotoristaId(metrica.motoristaId);
    setMotoristaNome(metrica.motoristaNome);
    setData(metrica.data);
    setIdRota(metrica.idRota || "");
    setCodigoGaiola(metrica.codigoGaiola || "");
    setTotal(String(metrica.qtdPacotesTotal || ""));
    setInsucesso(String(metrica.qtdPacotesNaoEntregues || ""));
    setMotivo(metrica.motivoNaoEntrega || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleExcluir(id: string) {
    const confirmar = confirm("Deseja realmente excluir esta métrica?");

    if (!confirmar) return;

    await excluirMetrica(id);

    alert("Métrica excluída");
    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const metricasDoDia = metricas
    .filter((item) => (data ? item.data === data : true))
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));

  return (
    <ProtectedPage>
      <div className="flex flex-col md:flex-row">
        <Sidebar />

        <div className="flex-1">
          <Header />

          <main className="p-6 bg-zinc-950 min-h-screen">
            <h1 className="text-3xl text-yellow-400 font-bold mb-6">
              Métricas DS por Rota
            </h1>

            <div className="bg-zinc-900 p-6 rounded space-y-4 mb-8">
              {editandoId && (
                <div className="bg-yellow-400 text-black p-3 rounded font-bold">
                  Editando métrica
                </div>
              )}

              <select
                value={motoristaId}
                onChange={(e) => {
                  const motorista = motoristas.find(
                    (m) => m.id === e.target.value
                  );

                  setMotoristaId(e.target.value);
                  setMotoristaNome(motorista?.nomeCompleto || "");
                }}
                className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700"
              >
                <option value="">Selecione o motorista</option>

                {motoristas.map((motorista) => (
                  <option key={motorista.id} value={motorista.id}>
                    {motorista.nomeCompleto}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700"
              />

              <input
                placeholder="ID da Rota"
                value={idRota}
                onChange={(e) => setIdRota(e.target.value)}
                className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700 placeholder:text-zinc-400"
              />

              <input
                placeholder="Código da Gaiola / Rota"
                value={codigoGaiola}
                onChange={(e) => setCodigoGaiola(e.target.value)}
                className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700 placeholder:text-zinc-400"
              />

              <input
                placeholder="Qtd pacotes total"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700 placeholder:text-zinc-400"
              />

              <input
                placeholder="Qtd não entregues"
                value={insucesso}
                onChange={(e) => setInsucesso(e.target.value)}
                className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700 placeholder:text-zinc-400"
              />

              <textarea
                placeholder="Motivo da não entrega (interno, não aparece no relatório)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700 placeholder:text-zinc-400"
              />

              <div className="bg-black p-4 rounded">
                <p className="text-white">DS da rota</p>

                <p className="text-yellow-400 text-4xl font-bold">
                  {ds}%
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSalvar}
                  className="bg-yellow-400 text-black font-bold px-6 py-3 rounded"
                >
                  {editandoId ? "Salvar Alterações" : "Salvar Métrica da Rota"}
                </button>

                {editandoId && (
                  <button
                    onClick={limparFormulario}
                    className="bg-zinc-700 text-white font-bold px-6 py-3 rounded"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded">
              <h2 className="text-yellow-400 text-2xl font-bold mb-4">
                Métricas do Dia por Rota
              </h2>

              <p className="text-zinc-400 mb-4">
                Cada rota/gaiola lançada aparece como uma métrica separada.
              </p>

              <div className="space-y-3">
                {metricasDoDia.map((metrica) => (
                  <div
                    key={metrica.id}
                    className="bg-black border border-zinc-800 rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <p className="text-white font-bold">
                        {metrica.motoristaNome}
                      </p>

                      <p className="text-zinc-400 text-sm">
                        Data: {metrica.data} | ID Rota:{" "}
                        {metrica.idRota ? (
                          <a
                            href={gerarLinkMercadoLivre(metrica.idRota)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-yellow-400 underline font-bold"
                          >
                            {metrica.idRota}
                          </a>
                        ) : (
                          "-"
                        )}{" "}
                        | Gaiola: {metrica.codigoGaiola || "-"}
                      </p>

                      <p className="text-zinc-400 text-sm">
                        Pacotes: {metrica.qtdPacotesTotal} | Insucessos:{" "}
                        {metrica.qtdPacotesNaoEntregues} | DS da rota:{" "}
                        <span className="text-yellow-400 font-bold">
                          {metrica.ds}%
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditar(metrica)}
                        className="bg-yellow-400 text-black px-4 py-2 rounded font-bold"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleExcluir(metrica.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded font-bold"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}

                {metricasDoDia.length === 0 && (
                  <p className="text-white">
                    Nenhuma métrica cadastrada para esta data.
                  </p>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedPage>
  );
}
