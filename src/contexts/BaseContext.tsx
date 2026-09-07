"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { listarBases } from "@/services/baseService";

export interface Base {
  id: string;
  nome: string;
  ativo: boolean;
}

interface BaseContextType {
  bases: Base[];
  baseAtual: string;
  setBaseAtual: (baseId: string) => void;
  recarregarBases: () => Promise<void>;
}

const BaseContext = createContext<BaseContextType>({
  bases: [],
  baseAtual: "",
  setBaseAtual: () => {},
  recarregarBases: async () => {},
});

export function BaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const [bases, setBases] = useState<Base[]>([]);
  const [baseSelecionada, setBaseSelecionada] = useState(() => {
    if (typeof window === "undefined") return "";

    return localStorage.getItem("baseAtual") || "";
  });

  const baseAtual =
    user?.cargo === "gestor"
      ? user.baseId || ""
      : baseSelecionada || user?.baseId || "";

  function setBaseAtual(baseId: string) {
    if (user?.cargo === "gestor") return;

    setBaseSelecionada(baseId);

    if (typeof window !== "undefined") {
      localStorage.setItem("baseAtual", baseId);
    }
  }

  async function recarregarBases() {
    setBases(await listarBases(true));
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void recarregarBases();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <BaseContext.Provider
      value={{
        bases,
        baseAtual,
        setBaseAtual,
        recarregarBases,
      }}
    >
      {children}
    </BaseContext.Provider>
  );
}

export function useBase() {
  return useContext(BaseContext);
}
