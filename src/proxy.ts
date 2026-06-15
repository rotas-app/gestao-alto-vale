import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0].toLowerCase();

  if (hostname?.endsWith(".vercel.app")) {
    const destination = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      "https://gestaoalto.com.br",
    ).toString();

    const page = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Novo endereco | Gestao Alto</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: #f4f7fb;
        color: #172033;
        font-family: Arial, sans-serif;
      }
      main {
        width: min(100%, 520px);
        padding: 40px;
        border: 1px solid #dce3ed;
        border-radius: 20px;
        background: #fff;
        box-shadow: 0 20px 60px rgba(23, 32, 51, 0.12);
        text-align: center;
      }
      h1 { margin: 0 0 14px; font-size: 28px; }
      p { margin: 0 0 26px; color: #596579; line-height: 1.6; }
      a {
        display: inline-block;
        padding: 14px 22px;
        border-radius: 10px;
        background: #1d4ed8;
        color: #fff;
        font-weight: 700;
        text-decoration: none;
      }
      small {
        display: block;
        margin-top: 18px;
        color: #7a8596;
        overflow-wrap: anywhere;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Nosso endereco mudou</h1>
      <p>Este dominio foi desativado. Continue acessando o Gestao Alto pelo novo endereco oficial.</p>
      <a href="${destination}">Acessar gestaoalto.com.br</a>
      <small>https://gestaoalto.com.br</small>
    </main>
  </body>
</html>`;

    return new NextResponse(page, {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
