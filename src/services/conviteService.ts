import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export async function criarConviteGestor(
  nome: string,
  email: string
) {
  const token = crypto.randomUUID();

  const conviteRef = await addDoc(
    collection(db, "convites"),
    {
      nome,
      email,
      cargo: "gestor",
      token,
      status: "pendente",
      createdAt: new Date(),
    }
  );

  const link = `${window.location.origin}/convite/${token}`;

  return {
    id: conviteRef.id,
    link,
  };
}

export async function buscarConvitePorToken(
  token: string
) {
  const q = query(
    collection(db, "convites"),
    where("token", "==", token)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const documento = snapshot.docs[0];

  return {
    id: documento.id,
    ...documento.data(),
  } as any;
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
      cargo: "gestor",
      status: "ativo",
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