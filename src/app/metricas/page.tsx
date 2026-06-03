"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

import {
  listarMotoristas,
} from "@/services/motoristaService";

import {
  criarMetrica,
} from "@/services/metricaService";

import {
  calcularDS,
} from "@/utils/calcDS";

export default function MetricasPage() {

  const [motoristas, setMotoristas] =
    useState<any[]>([]);

  const [motoristaId, setMotoristaId] =
    useState("");

  const [motoristaNome, setMotoristaNome] =
    useState("");

  const [data, setData] =
    useState("");

  const [codigoGaiola, setCodigoGaiola] =
    useState("");

  const [total, setTotal] =
    useState("");

  const [insucesso, setInsucesso] =
    useState("");

  const [motivo, setMotivo] =
    useState("");

  const ds =
    calcularDS(
      Number(total),
      Number(insucesso)
    );

  async function carregarMotoristas() {

    const data =
      await listarMotoristas();

    setMotoristas(data);
  }

  async function handleSalvar() {

    await criarMetrica({
      motoristaId,
      motoristaNome,
      data,
      codigoGaiola,
      qtdPacotesTotal:
        Number(total),
      qtdPacotesNaoEntregues:
        Number(insucesso),
      motivoNaoEntrega:
        motivo,
      ds,
    });

    alert("Métrica salva");
  }

  useEffect(() => {
    carregarMotoristas();
  }, []);

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1">

        <Header />

        <main className="p-6 bg-zinc-950 min-h-screen">

          <h1 className="text-3xl text-yellow-400 font-bold mb-6">
            Métricas DS
          </h1>

          <div className="bg-zinc-900 p-6 rounded space-y-4">

            <select
              value={motoristaId}
              onChange={(e) => {

                const motorista =
                  motoristas.find(
                    (m) =>
                      m.id ===
                      e.target.value
                  );

                setMotoristaId(
                  e.target.value
                );

                setMotoristaNome(
                  motorista?.nomeCompleto || ""
                );
              }}
              className="w-full p-3 rounded text-black"
            >

              <option value="">
                Selecione o motorista
              </option>

              {motoristas.map(
                (motorista) => (

                  <option
                    key={motorista.id}
                    value={motorista.id}
                  >
                    {motorista.nomeCompleto}
                  </option>
                )
              )}

            </select>

            <input
              type="date"
              value={data}
              onChange={(e) =>
                setData(e.target.value)
              }
              className="w-full p-3 rounded text-black"
            />

            <input
              placeholder="Código da Gaiola"
              value={codigoGaiola}
              onChange={(e) =>
                setCodigoGaiola(
                  e.target.value
                )
              }
              className="w-full p-3 rounded text-black"
            />

            <input
              placeholder="Qtd pacotes total"
              value={total}
              onChange={(e) =>
                setTotal(e.target.value)
              }
              className="w-full p-3 rounded text-black"
            />

            <input
              placeholder="Qtd não entregues"
              value={insucesso}
              onChange={(e) =>
                setInsucesso(
                  e.target.value
                )
              }
              className="w-full p-3 rounded text-black"
            />

            <textarea
              placeholder="Motivo da não entrega"
              value={motivo}
              onChange={(e) =>
                setMotivo(
                  e.target.value
                )
              }
              className="w-full p-3 rounded text-black"
            />

            <div className="bg-black p-4 rounded">

              <p className="text-white">
                DS Calculado
              </p>

              <p className="text-yellow-400 text-4xl font-bold">
                {ds}%
              </p>

            </div>

            <button
              onClick={handleSalvar}
              className="bg-yellow-400 text-black font-bold px-6 py-3 rounded"
            >
              Salvar Métrica
            </button>

          </div>

        </main>

      </div>

    </div>
  );
}