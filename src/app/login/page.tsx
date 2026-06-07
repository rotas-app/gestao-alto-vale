"use client";

import { useState } from "react";
import { login } from "@/services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleLogin() {
  try {
    await login(email, senha);

    window.location.href = "/dashboard";
  } catch (error) {
    console.error(error);

    alert("E-mail ou senha inválidos");
  }
}

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-zinc-900 p-8 rounded-lg w-full max-w-md border border-yellow-400">

        <h1 className="text-yellow-400 text-3xl font-bold text-center mb-2">
          Alto Vale
        </h1>

        <p className="text-white text-center mb-6">
          Gestão Interna de Motoristas
        </p>

        <input
          className="w-full p-3 rounded mb-4 text-white"
          placeholder="E-mail"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          className="w-full p-3 rounded mb-4 text-white"
          placeholder="Senha"
          value={senha}
          onChange={(e) =>
            setSenha(e.target.value)
          }
        />

        <button
          onClick={handleLogin}
          className="w-full bg-yellow-400 text-white font-bold p-3 rounded"
        >
          Entrar
        </button>

      </div>
    </main>
  );
}