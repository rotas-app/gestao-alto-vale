import {
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