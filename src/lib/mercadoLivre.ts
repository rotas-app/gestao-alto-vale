import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebaseAdmin";

const API_URL = "https://api.mercadolibre.com";
const AUTH_URL = "https://auth.mercadolivre.com.br/authorization";
const INTEGRACAO_REF = "integracoes/mercadolivre";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

interface DadosCriptografados {
  iv: string;
  tag: string;
  value: string;
}

export interface MercadoLivreUser {
  id: number;
  nickname: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  country_id?: string;
}

function getConfig() {
  const clientId = process.env.MERCADOLIVRE_CLIENT_ID;
  const clientSecret = process.env.MERCADOLIVRE_CLIENT_SECRET;
  const redirectUri = process.env.MERCADOLIVRE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Configure MERCADOLIVRE_CLIENT_ID, MERCADOLIVRE_CLIENT_SECRET e MERCADOLIVRE_REDIRECT_URI."
    );
  }

  return { clientId, clientSecret, redirectUri };
}

function getEncryptionKey() {
  const value = process.env.MERCADOLIVRE_TOKEN_ENCRYPTION_KEY;

  if (!value) {
    throw new Error("Configure MERCADOLIVRE_TOKEN_ENCRYPTION_KEY.");
  }

  const key = Buffer.from(value, "base64");

  if (key.length !== 32) {
    throw new Error(
      "MERCADOLIVRE_TOKEN_ENCRYPTION_KEY deve conter 32 bytes em base64."
    );
  }

  return key;
}

function criptografar(value: string): DadosCriptografados {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);

  return {
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    value: encrypted.toString("base64"),
  };
}

function descriptografar(data: DadosCriptografados) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(data.iv, "base64")
  );

  decipher.setAuthTag(Buffer.from(data.tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(data.value, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

async function solicitarToken(params: URLSearchParams) {
  const response = await fetch(`${API_URL}/oauth/token`, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
    cache: "no-store",
  });

  const data = (await response.json()) as TokenResponse & {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Falha ao obter token do Mercado Livre."
    );
  }

  return data;
}

async function salvarTokens(
  tokens: TokenResponse,
  usuario: MercadoLivreUser,
  connectedBy: string
) {
  await getAdminDb().doc(INTEGRACAO_REF).set(
    {
      provider: "mercadolivre",
      connected: true,
      connectedBy,
      mlUserId: String(tokens.user_id),
      nickname: usuario.nickname || "",
      email: usuario.email || "",
      countryId: usuario.country_id || "",
      scope: tokens.scope || "",
      tokenType: tokens.token_type || "bearer",
      accessToken: criptografar(tokens.access_token),
      refreshToken: criptografar(tokens.refresh_token),
      expiresAt: Timestamp.fromMillis(
        Date.now() + Number(tokens.expires_in || 21600) * 1000
      ),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export function criarUrlAutorizacao(state: string) {
  const { clientId, redirectUri } = getConfig();
  const url = new URL(AUTH_URL);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);

  return url.toString();
}

export async function trocarCodigoPorToken(
  code: string,
  connectedBy: string
) {
  const { clientId, clientSecret, redirectUri } = getConfig();
  const tokens = await solicitarToken(
    new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    })
  );
  const usuario = await consultarUsuario(tokens.access_token);

  await salvarTokens(tokens, usuario, connectedBy);

  return usuario;
}

export async function consultarUsuario(accessToken: string) {
  const response = await fetch(`${API_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  const data = (await response.json()) as MercadoLivreUser & {
    message?: string;
  };

  if (!response.ok) {
    throw new Error(data.message || "Falha ao consultar a conta autorizada.");
  }

  return data;
}

export async function obterAccessTokenValido() {
  const snapshot = await getAdminDb().doc(INTEGRACAO_REF).get();
  const data = snapshot.data();

  if (!snapshot.exists || !data?.connected) {
    throw new Error("Mercado Livre não conectado.");
  }

  const expiresAt = data.expiresAt as Timestamp | undefined;

  if (
    expiresAt &&
    expiresAt.toMillis() > Date.now() + 60_000 &&
    data.accessToken
  ) {
    return descriptografar(data.accessToken as DadosCriptografados);
  }

  const { clientId, clientSecret } = getConfig();
  const refreshToken = descriptografar(
    data.refreshToken as DadosCriptografados
  );
  const tokens = await solicitarToken(
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    })
  );
  const usuario = await consultarUsuario(tokens.access_token);

  await salvarTokens(tokens, usuario, data.connectedBy || "system");

  return tokens.access_token;
}

export async function obterStatusMercadoLivre() {
  const snapshot = await getAdminDb().doc(INTEGRACAO_REF).get();
  const data = snapshot.data();

  if (!snapshot.exists || !data?.connected) {
    return { connected: false };
  }

  return {
    connected: true,
    mlUserId: data.mlUserId || "",
    nickname: data.nickname || "",
    email: data.email || "",
    scope: data.scope || "",
    expiresAt:
      data.expiresAt instanceof Timestamp
        ? data.expiresAt.toDate().toISOString()
        : null,
  };
}
