"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  aceitarConvite,
  buscarConvitePorToken,
} from "@/services/conviteService";

export default function ConvitePage() {
  const params = useParams();
  const token = String(params.token);

  const [convite, setConvite] = useState<any>(null);
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(true);

  async function carregarConvite() {
  try {
    const data = await buscarConvitePorToken(token);
    setConvite(data);
  } catch (error) {
    console.error("Erro ao carregar convite:", error);
    alert("Erro ao carregar convite. Verifique as permissões do Firestore.");
  } finally {
    setLoading(false);
  }
}

  async function handleAceitar() {
    try {
      await aceitarConvite(token, senha);
      alert("Conta criada com sucesso");
      window.location.href = "/dashboard";
    } catch (error: any) {
      alert(error.message || "Erro ao aceitar convite");
    }
  }

  useEffect(() => {
    carregarConvite();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-yellow-400">Carregando convite...</p>
      </main>
    );
  }

  if (!convite) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-red-400">Convite inválido.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-zinc-900 border border-yellow-400 rounded p-8 w-full max-w-md">
        <h1 className="text-yellow-400 text-3xl font-bold text-center mb-2">
          Alto Vale
        </h1>

        <p className="text-white text-center mb-6">
          Ativar conta de gestor
        </p>

        <div className="bg-black p-4 rounded mb-4">
          <p className="text-white">
            Nome: {convite.nome}
          </p>
          <p className="text-white">
            Email: {convite.email}
          </p>
        </div>

        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Crie uma senha"
          className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700 mb-4"
        />

        <button
          onClick={handleAceitar}
          className="w-full bg-yellow-400 text-white font-bold p-3 rounded"
        >
          Ativar conta
        </button>
      </div>
    </main>
  );
}