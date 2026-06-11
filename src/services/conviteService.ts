import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export interface Convite {
  id: string;
  nome: string;
  email: string;
  baseId?: string;
  cargo: "gestor";
  status: "pendente" | "aceito";
  token: string;
}

export async function criarConviteGestor(
  nome: string,
  email: string,
  baseId: string
) {
  const token = crypto.randomUUID();

  const conviteRef = doc(db, "convites", token);

  await setDoc(conviteRef, {
    nome,
    email,
    baseId,
    cargo: "gestor",
    token,
    status: "pendente",
    createdAt: new Date(),
  });

  const link = `${window.location.origin}/convite/${token}`;

  return {
    id: conviteRef.id,
    link,
  };
}

export async function buscarConvitePorToken(
  token: string
) {
  const snapshot = await getDoc(doc(db, "convites", token));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Convite;
}

export async function aceitarConvite(
  token: string,
  senha: string
) {
  const convite =
    await buscarConvitePorToken(token);

  if (!convite) {
    throw new Error("Convite inválido");
  }

  if (convite.status !== "pendente") {
    throw new Error("Convite já utilizado");
  }

  if (!convite.baseId) {
    throw new Error("Este convite não possui uma base vinculada");
  }

  const cred =
    await createUserWithEmailAndPassword(
      auth,
      convite.email,
      senha
    );

  await setDoc(
    doc(db, "usuarios", cred.user.uid),
    {
      uid: cred.user.uid,
      nome: convite.nome,
      email: convite.email,
      baseId: convite.baseId,
      cargo: "gestor",
      status: "ativo",
      conviteToken: token,
      createdAt: new Date(),
    }
  );

  await updateDoc(
    doc(db, "convites", convite.id),
    {
      status: "aceito",
      uid: cred.user.uid,
      aceitoEm: new Date(),
    }
  );

  await signOut(auth);

  return cred.user;
}
