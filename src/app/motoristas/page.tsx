"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

import {
  criarMotorista,
  excluirMotorista,
  listarMotoristas,
} from "@/services/motoristaService";

export default function MotoristasPage() {

  const [nome, setNome] =
    useState("");

  const [motoristas, setMotoristas] =
    useState<any[]>([]);

  const [busca, setBusca] =
    useState("");

  async function carregarMotoristas() {

    const data =
      await listarMotoristas();

    setMotoristas(data);
  }

  async function handleCriar() {

    if (!nome) return;

    await criarMotorista(nome);

    setNome("");

    carregarMotoristas();
  }

  async function handleExcluir(
    id: string
  ) {

    await excluirMotorista(id);

    carregarMotoristas();
  }

  useEffect(() => {
    carregarMotoristas();
  }, []);

  const filtrados =
    motoristas.filter(
      (m) =>
        m.nomeCompleto
          ?.toLowerCase()
          .includes(
            busca.toLowerCase()
          )
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
              onChange={(e) =>
                setNome(e.target.value)
              }
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
              onChange={(e) =>
                setBusca(e.target.value)
              }
              placeholder="Buscar motorista..."
              className="w-full p-3 rounded text-black"
            />

          </div>

          <div className="space-y-4">

            {filtrados.map(
              (motorista) => (

                <details
                  key={motorista.id}
                  className="bg-zinc-900 rounded"
                >

                  <summary className="cursor-pointer p-4 text-white font-bold">

                    {motorista.nomeCompleto}

                  </summary>

                  <div className="p-4 border-t border-zinc-700">

                    <button
                      onClick={() =>
                        handleExcluir(
                          motorista.id
                        )
                      }
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      Excluir
                    </button>

                  </div>

                </details>
              )
            )}

          </div>

        </main>

      </div>

    </div>
  );
}