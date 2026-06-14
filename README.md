# Gestao Interna Alto Vale

Painel operacional para controle de bases, motoristas, rotas, metricas DS,
rankings e relatorios da Alto Vale Transportes.

## Requisitos

- Node.js 24
- Java 21 ou superior para o emulador do Firestore
- Projeto Firebase `gestao-interna-alto-vale`
- Aplicacao publicada na Vercel

## Ambiente local

1. Copie as variaveis de `.env.example` para `.env.local`.
2. Preencha as chaves publicas do aplicativo Web no Firebase.
3. Execute `npm ci`.
4. Execute `npm run dev`.
5. Abra `http://localhost:3000`.

As chaves `NEXT_PUBLIC_FIREBASE_*` identificam o projeto, mas nao substituem as
regras de seguranca do Firestore. Nunca salve credenciais de conta de servico no
repositorio.

## Validacao

```powershell
npm run verify
```

O comando executa TypeScript, ESLint, testes das regras do Firestore e build de
producao. O mesmo processo roda no GitHub Actions em `.github/workflows/ci.yml`.

## Publicacao

### Aplicacao

A branch `main` deve estar conectada ao projeto Vercel
`gestao-alto-vale`. Cadastre na Vercel as mesmas variaveis Firebase usadas
localmente.

Para ativar o Sentry, adicione:

- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_APP_ENV=production`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

O sistema nao envia cookies nem dados de formularios ao Sentry por padrao.

### Regras do Firestore

```powershell
npm run test:rules
npx firebase-tools deploy --only firestore:rules
```

O projeto padrao esta fixado em `.firebaserc`. Confira sempre no terminal se o
destino exibido e `gestao-interna-alto-vale`.

## Backup

O backup gerenciado requer Firebase Blaze, um bucket Cloud Storage e permissoes
de exportacao. Depois de criar esses recursos, configure no ambiente
`production` do GitHub:

- Variable `FIREBASE_PROJECT_ID`
- Variable `FIRESTORE_BACKUP_BUCKET`
- Variable `BACKUP_ENABLED=true`
- Secret `GCP_WORKLOAD_IDENTITY_PROVIDER`
- Secret `GCP_BACKUP_SERVICE_ACCOUNT`

O workflow `.github/workflows/firestore-backup.yml` solicita uma exportacao
diaria as 00:30 no horario de Brasilia. O script local equivalente e:

```powershell
.\scripts\backup-firestore.ps1 `
  -ProjectId gestao-interna-alto-vale `
  -Bucket NOME_DO_BUCKET
```

Consulte [docs/OPERACAO.md](docs/OPERACAO.md) para restauracao, suporte e
resposta a incidentes.

## Documentos

- [Operacao, suporte e recuperacao](docs/OPERACAO.md)
- [Privacidade e LGPD](docs/PRIVACIDADE-LGPD.md)
- [Autorizacao de integracao Mercado Livre](docs/AUTORIZACAO-MERCADO-LIVRE.md)
- [Proposta comercial sugerida](docs/PROPOSTA-COMERCIAL.md)
