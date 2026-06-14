# Operacao, suporte e recuperacao

## Responsabilidades

- A Alto Vale define quem pode acessar o sistema e quais dados podem ser usados.
- O administrador cadastra bases, envia convites e desativa acessos.
- O fornecedor tecnico mantem aplicacao, regras, monitoramento e rotina de
  backup conforme o contrato.

## Publicacao segura

1. Rodar `npm run verify`.
2. Conferir `git status` e revisar o diff.
3. Publicar a aplicacao pela branch `main`.
4. Publicar regras com
   `npx firebase-tools deploy --only firestore:rules`.
5. Testar login, troca de base, cadastro de rota, sincronizacao e PDF.
6. Conferir erros novos no Sentry por pelo menos 15 minutos.

## Suporte

### Prioridades sugeridas

| Prioridade | Exemplo | Primeiro retorno | Objetivo de solucao |
| --- | --- | ---: | ---: |
| P1 | Sistema indisponivel ou perda de dados | 1 hora util | 4 horas uteis |
| P2 | Fluxo principal bloqueado | 4 horas uteis | 1 dia util |
| P3 | Erro com alternativa operacional | 1 dia util | 3 dias uteis |
| P4 | Melhoria ou duvida | 2 dias uteis | Proxima versao acordada |

O contrato comercial deve definir horario de atendimento, canal oficial e
exclusoes do SLA.

## Recuperacao de acesso

- O usuario usa `Esqueci minha senha` na tela de login.
- Usuario inativo deve solicitar reativacao ao administrador.
- Perfil ausente deve ser investigado no Firebase Auth e em
  `usuarios/{uid}` antes de qualquer recriacao.
- Nunca compartilhar senhas ou criar senhas em nome do usuario.

## Backup e restauracao

### Estado necessario

- Projeto no plano Blaze.
- Bucket na mesma regiao ou proximo de `southamerica-east1`.
- Workflow diario ativo e com execucoes verdes.
- Politica de retencao recomendada: 30 backups diarios e 12 mensais.

### Restauracao

1. Suspender alteracoes no sistema.
2. Identificar o ultimo backup valido.
3. Registrar horario, motivo e responsavel pela restauracao.
4. Executar:

```text
gcloud firestore import gs://BUCKET/CAMINHO_DO_BACKUP \
  --project=gestao-interna-alto-vale \
  --database="(default)"
```

5. Validar usuarios, bases, motoristas, metricas e relatorios.
6. Reabrir o sistema e registrar o resultado.

Importacoes geram gravacoes faturadas e nao removem automaticamente documentos
criados depois do backup. Teste o procedimento em ambiente separado antes de
uma emergencia real.

## Incidentes

1. Registrar inicio, impacto, usuarios afetados e ultima acao conhecida.
2. Preservar logs; nao apagar dados para "tentar resolver".
3. Revogar acessos comprometidos.
4. Restaurar servico ou aplicar contorno.
5. Avaliar comunicacao de incidente de dados conforme LGPD e contrato.
6. Produzir causa raiz e acao preventiva.

## Verificacao mensal

- Testar recuperacao de senha.
- Revisar usuarios ativos.
- Conferir backups e restaurar uma amostra em ambiente separado.
- Revisar alertas do Sentry e custos do Firebase/Vercel.
- Atualizar dependencias e rodar `npm audit`.
- Confirmar que as regras publicadas correspondem ao repositorio.
