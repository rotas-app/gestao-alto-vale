import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export async function login(
  email: string,
  senha: string
) {
  return signInWithEmailAndPassword(
    auth,
    email,
    senha
  );
}

export async function logout() {
  return signOut(auth);
}

export async function recuperarSenha(email: string) {
  const emailNormalizado = email.trim().toLowerCase();

  if (!emailNormalizado) {
    throw new Error("Informe seu e-mail para recuperar a senha.");
  }

  await sendPasswordResetEmail(auth, emailNormalizado);
}
