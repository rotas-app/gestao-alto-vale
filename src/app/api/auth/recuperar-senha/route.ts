import { createHash, createSign } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const attempts = new Map<string, number[]>();

interface OobResponse {
  oobLink?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!isValidEmail(email)) {
      return genericResponse();
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || "unknown";
    const rateLimitKey = createHash("sha256")
      .update(`${clientIp}:${email}`)
      .digest("hex");

    if (isRateLimited(rateLimitKey)) {
      return genericResponse();
    }

    const resetLink = await generatePasswordResetLink(email, clientIp);

    if (resetLink) {
      await sendPasswordResetEmail(email, resetLink);
    }
  } catch (error) {
    console.error("Falha ao solicitar recuperação de senha:", error);
  }

  return genericResponse();
}

function genericResponse() {
  return NextResponse.json({
    ok: true,
    message:
      "Se o e-mail estiver cadastrado, as instruções serão enviadas.",
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRateLimited(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );

  if (recent.length >= MAX_REQUESTS) {
    attempts.set(key, recent);
    return true;
  }

  recent.push(now);
  attempts.set(key, recent);
  return false;
}

async function generatePasswordResetLink(
  email: string,
  clientIp: string
) {
  const projectId = requiredEnv("FIREBASE_ADMIN_PROJECT_ID");
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email,
        returnOobLink: true,
        targetProjectId: projectId,
        userIp: clientIp,
      }),
      cache: "no-store",
    }
  );

  if (response.status === 400 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Firebase respondeu ${response.status}.`);
  }

  const data = (await response.json()) as OobResponse;

  if (!data.oobLink) {
    return null;
  }

  const firebaseLink = new URL(data.oobLink);
  const oobCode = firebaseLink.searchParams.get("oobCode");

  if (!oobCode) {
    throw new Error("Firebase não retornou o código de recuperação.");
  }

  const appUrl =
    process.env.APP_URL?.replace(/\/$/, "")
    || "https://gestaoalto.com.br";

  return `${appUrl}/redefinir-senha?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}`;
}

async function getGoogleAccessToken() {
  const clientEmail = requiredEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = requiredEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(
    /\\n/g,
    "\n"
  );
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url({
    alg: "RS256",
    typ: "JWT",
  });
  const payload = base64Url({
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/identitytoolkit",
  });
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  const signature = signer.sign(privateKey).toString("base64url");
  const assertion = `${unsignedToken}.${signature}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google OAuth respondeu ${response.status}.`);
  }

  const data = (await response.json()) as { access_token?: string };

  if (!data.access_token) {
    throw new Error("Google OAuth não retornou um token.");
  }

  return data.access_token;
}

async function sendPasswordResetEmail(
  email: string,
  resetLink: string
) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": requiredEnv("BREVO_API_KEY"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "Gestão Alto",
        email: "seguranca@gestaoalto.com.br",
      },
      replyTo: {
        name: "Suporte Gestão Alto",
        email: "seguranca@gestaoalto.com.br",
      },
      to: [{ email }],
      subject: "Redefina sua senha | Gestão Alto",
      htmlContent: emailHtml(resetLink),
      textContent:
        `Recebemos uma solicitação para redefinir sua senha.\n\n`
        + `Acesse: ${resetLink}\n\n`
        + "Se você não solicitou esta alteração, ignore esta mensagem.",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Brevo respondeu ${response.status}.`);
  }
}

function emailHtml(resetLink: string) {
  const escapedLink = resetLink.replaceAll("&", "&amp;");

  return `
    <div style="background:#f4f4f5;padding:32px 16px;font-family:Arial,sans-serif;color:#18181b">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4e4e7;border-radius:18px;overflow:hidden">
        <div style="background:#09090b;padding:24px 28px;border-bottom:4px solid #facc15">
          <div style="font-size:21px;font-weight:800;color:#facc15">GESTÃO ALTO</div>
          <div style="margin-top:5px;color:#a1a1aa;font-size:13px">Gestão operacional</div>
        </div>
        <div style="padding:30px 28px">
          <h1 style="margin:0;font-size:25px">Redefinição de senha</h1>
          <p style="margin:18px 0 24px;line-height:1.6;color:#52525b">
            Recebemos uma solicitação para criar uma nova senha para sua conta.
          </p>
          <a href="${escapedLink}" style="display:inline-block;background:#facc15;color:#09090b;text-decoration:none;font-weight:800;padding:14px 22px;border-radius:12px">
            Redefinir minha senha
          </a>
          <p style="margin:26px 0 0;line-height:1.6;color:#71717a;font-size:13px">
            Se você não solicitou esta alteração, ignore esta mensagem. Sua senha atual continuará válida.
          </p>
        </div>
        <div style="background:#fafafa;padding:18px 28px;color:#71717a;font-size:12px">
          Mensagem automática de segurança. Nunca informe sua senha por e-mail ou telefone.
        </div>
      </div>
    </div>
  `;
}

function base64Url(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável ${name} não configurada.`);
  }

  return value;
}
