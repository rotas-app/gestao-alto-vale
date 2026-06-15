"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
} from "lucide-react";

import {
  redefinirSenha,
  validarCodigoRecuperacao,
} from "@/services/authService";

type Estado = "validando" | "formulario" | "sucesso" | "invalido";

function RedefinirSenhaContent() {
  const params = useSearchParams();
  const codigo = params.get("oobCode") || "";

  const [estado, setEstado] = useState<Estado>("validando");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    validarCodigoRecuperacao(codigo)
      .then((emailValidado) => {
        if (!ativo) return;

        setEmail(emailValidado);
        setEstado("formulario");
      })
      .catch(() => {
        if (ativo) {
          setEstado("invalido");
        }
      });

    return () => {
      ativo = false;
    };
  }, [codigo]);

  async function handleRedefinir() {
    setErro("");

    if (senha !== confirmacao) {
      setErro("As senhas informadas não são iguais.");
      return;
    }

    try {
      setSalvando(true);
      await redefinirSenha(codigo, senha);
      setEstado("sucesso");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir sua senha."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.18),_transparent_35%),linear-gradient(180deg,#09090b,#000000)] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative grid w-full max-w-5xl grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
        <section className="hidden flex-col justify-between rounded-[2rem] border border-zinc-800 bg-black/60 p-10 backdrop-blur-xl lg:flex">
          <div>
            <div className="w-full max-w-sm rounded-3xl border border-zinc-800 bg-black p-6 shadow-2xl">
              <Image
                src="/logo-alto-vale.png"
                alt="Alto Vale Transportes"
                width={280}
                height={140}
                className="object-contain"
                priority
              />
            </div>

            <p className="mt-10 text-xs font-bold uppercase tracking-[0.35em] text-yellow-400">
              Acesso seguro
            </p>

            <h1 className="mt-4 text-5xl font-black leading-tight text-white">
              Crie uma nova senha.
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-zinc-400">
              O link é individual, possui validade limitada e só pode ser
              utilizado uma vez.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-yellow-400" size={22} />
              <p className="font-bold text-white">Proteção da sua conta</p>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              A Alto Vale nunca solicita sua senha por e-mail ou telefone.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950/90 p-8 shadow-2xl shadow-yellow-400/10 backdrop-blur-xl md:p-10">
          <div className="mb-8 flex justify-center lg:hidden">
            <div className="w-64 rounded-3xl border border-zinc-800 bg-black p-5">
              <Image
                src="/logo-alto-vale.png"
                alt="Alto Vale Transportes"
                width={240}
                height={110}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {estado === "validando" && (
            <StatusCard
              icon={<KeyRound size={26} />}
              title="Validando seu link"
              description="Aguarde enquanto confirmamos a solicitação de recuperação."
            />
          )}

          {estado === "invalido" && (
            <StatusCard
              icon={<Lock size={26} />}
              title="Link inválido ou expirado"
              description="Solicite um novo link na tela de login. Por segurança, links antigos deixam de funcionar."
              action={
                <Link
                  href="/login"
                  className="mt-7 block w-full rounded-2xl bg-yellow-400 p-4 text-center font-black text-black hover:bg-yellow-300"
                >
                  Voltar ao login
                </Link>
              }
            />
          )}

          {estado === "sucesso" && (
            <StatusCard
              icon={<CheckCircle2 size={28} />}
              title="Senha redefinida"
              description="Sua nova senha já está ativa. Você pode entrar novamente no sistema."
              action={
                <Link
                  href="/login"
                  className="mt-7 block w-full rounded-2xl bg-yellow-400 p-4 text-center font-black text-black hover:bg-yellow-300"
                >
                  Entrar no sistema
                </Link>
              }
            />
          )}

          {estado === "formulario" && (
            <>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/15 text-yellow-400">
                <KeyRound size={24} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.35em] text-yellow-400">
                Redefinição de senha
              </p>

              <h2 className="mt-3 text-4xl font-black text-white">
                Escolha sua nova senha
              </h2>

              <p className="mt-3 text-zinc-400">
                Alterando a senha de <strong className="text-white">{email}</strong>.
              </p>

              <div className="mt-8 space-y-4">
                <PasswordField
                  label="Nova senha"
                  value={senha}
                  show={mostrarSenha}
                  onChange={setSenha}
                  onToggle={() => setMostrarSenha((atual) => !atual)}
                />

                <PasswordField
                  label="Confirmar nova senha"
                  value={confirmacao}
                  show={mostrarSenha}
                  onChange={setConfirmacao}
                  onToggle={() => setMostrarSenha((atual) => !atual)}
                />

                <div className="rounded-2xl border border-zinc-800 bg-black p-4">
                  <p className="text-sm text-zinc-400">
                    Use no mínimo 8 caracteres. Prefira uma combinação que não
                    seja utilizada em outros serviços.
                  </p>
                </div>

                {erro && (
                  <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-400">
                    {erro}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleRedefinir}
                  disabled={salvando}
                  className="w-full rounded-2xl bg-yellow-400 p-4 font-black text-black shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? "Salvando nova senha..." : "Redefinir senha"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function PasswordField({
  label,
  value,
  show,
  onChange,
  onToggle,
}: {
  label: string;
  value: string;
  show: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-zinc-300">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black px-4 py-3 focus-within:border-yellow-400">
        <Lock size={20} className="text-zinc-500" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-white outline-none"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="text-zinc-500 hover:text-yellow-400"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </label>
  );
}

function StatusCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[430px] flex-col justify-center text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/15 text-yellow-400">
        {icon}
      </div>
      <h2 className="mt-6 text-3xl font-black text-white">{title}</h2>
      <p className="mt-4 leading-relaxed text-zinc-400">{description}</p>
      {action}
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black flex items-center justify-center">
          <p className="font-bold text-yellow-400">Carregando...</p>
        </main>
      }
    >
      <RedefinirSenhaContent />
    </Suspense>
  );
}
