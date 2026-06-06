"use client";

import { useState } from "react";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { criarConviteGestor } from "@/services/conviteService";
import ProtectedPage from "@/components/ProtectedPage";
import AdminOnly from "@/components/AdminOnly";

export default function UsuariosPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [linkConvite, setLinkConvite] = useState("");

  async function handleCriarConvite() {
    if (!nome || !email) {
      alert("Preencha nome e email");
      return;
    }

    const convite = await criarConviteGestor(nome, email);

    setLinkConvite(convite.link);
    setNome("");
    setEmail("");
  }

  return (
  <ProtectedPage>
    <AdminOnly>
      <div className="flex flex-col md:flex-row">
      <Sidebar />

      <div className="flex-1">
        <Header />

        <main className="p-6 bg-zinc-950 min-h-screen">
          <h1 className="text-3xl text-yellow-400 font-bold mb-6">
            Usuários
          </h1>

          <div className="bg-zinc-900 p-6 rounded max-w-xl">
            <h2 className="text-white text-xl font-bold mb-4">
              Convidar gestor
            </h2>

            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do gestor"
              className="w-full p-3 rounded text-black mb-4"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email do gestor"
              className="w-full p-3 rounded text-black mb-4"
            />

            <button
              onClick={handleCriarConvite}
              className="bg-yellow-400 text-black font-bold px-6 py-3 rounded"
            >
              Gerar convite
            </button>

            {linkConvite && (
              <div className="mt-6 bg-black p-4 rounded border border-yellow-400">
                <p className="text-white mb-2">
                  Link de convite:
                </p>

                <input
                  readOnly
                  value={linkConvite}
                  className="w-full p-3 rounded text-black mb-3"
                />

                <button
                  onClick={() => navigator.clipboard.writeText(linkConvite)}
                  className="bg-zinc-700 text-white px-4 py-2 rounded"
                >
                  Copiar link
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
     </div>
    </AdminOnly>
  </ProtectedPage>
);
}