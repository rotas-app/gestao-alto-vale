"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

interface Base {
  id: string;
  nome: string;
  ativo: boolean;
}

interface BaseContextType {
  bases: Base[];
  baseAtual: string;
  setBaseAtual: (baseId: string) => void;
}

const BaseContext = createContext<BaseContextType>({
  bases: [],
  baseAtual: "",
  setBaseAtual: () => {},
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

  useEffect(() => {
    async function carregarBases() {
      const q = query(
        collection(db, "bases"),
        where("ativo", "==", true)
      );

      const snapshot = await getDocs(q);

      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Base[];

      setBases(lista);
    }

    void carregarBases();
  }, []);

  return (
    <BaseContext.Provider
      value={{
        bases,
        baseAtual,
        setBaseAtual,
      }}
    >
      {children}
    </BaseContext.Provider>
  );
}

export function useBase() {
  return useContext(BaseContext);
}
