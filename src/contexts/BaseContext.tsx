"use client";

import {
  createContext,
  useCallback,
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
  const { user, loading } = useAuth();

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

  const recarregarBases = useCallback(async () => {
    if (loading || user?.status !== "ativo") {
      setBases([]);
      return;
    }

    try {
      setBases(await listarBases(true));
    } catch (error) {
      setBases([]);
      console.error("Falha ao carregar bases do usuario ativo:", error);
    }
  }, [loading, user?.status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void recarregarBases();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [recarregarBases, user?.uid]);

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
