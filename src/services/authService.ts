import {
  confirmPasswordReset,
  signInWithEmailAndPassword,
  signOut,
  verifyPasswordResetCode,
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

  const response = await fetch("/api/auth/recuperar-senha", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: emailNormalizado,
    }),
  });

  if (!response.ok) {
    throw new Error(
      "Não foi possível solicitar a recuperação agora. Tente novamente em alguns minutos."
    );
  }
}

export async function validarCodigoRecuperacao(codigo: string) {
  if (!codigo) {
    throw new Error("Link de recuperação inválido.");
  }

  return verifyPasswordResetCode(auth, codigo);
}

export async function redefinirSenha(
  codigo: string,
  novaSenha: string
) {
  if (novaSenha.length < 8) {
    throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
  }

  await confirmPasswordReset(auth, codigo, novaSenha);
}
