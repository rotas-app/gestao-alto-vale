# Aviso de privacidade e LGPD

> Modelo operacional para revisao e aprovacao da Alto Vale e de assessoria
> juridica. Preencher os campos entre colchetes antes da assinatura.

## Agentes de tratamento

- Controladora: `[RAZAO SOCIAL DA ALTO VALE]`
- CNPJ: `[CNPJ]`
- Contato de privacidade: `[E-MAIL OU CANAL]`
- Operador tecnico: `[NOME/RAZAO SOCIAL DO FORNECEDOR]`

A controladora define as finalidades e os acessos. O operador trata dados
somente para hospedagem, manutencao, suporte, seguranca e backup do sistema.

## Dados tratados

- Nome e e-mail de administradores e gestores.
- Base operacional e perfil de acesso.
- Nome de motoristas e dados operacionais associados a rotas.
- Identificador de rota, placa, cluster, status e quantidades agregadas.
- Logs de usuario, acao e horario.
- Informacoes tecnicas de erro sem senha, cookie ou conteudo de formulario.

O sistema nao deve armazenar senha em banco proprio. A autenticacao e realizada
pelo Firebase Authentication.

## Finalidades

- Controlar a operacao de entregas e desempenho.
- Gerar rankings e relatorios internos.
- Rastrear alteracoes para seguranca e auditoria.
- Prestar suporte, prevenir falhas e recuperar dados.

## Base legal

A Alto Vale deve documentar a base legal aplicavel a cada finalidade,
normalmente execucao de contrato, cumprimento de obrigacao legal/regulatoria ou
legitimo interesse com avaliacao de necessidade e impacto. Consentimento nao
deve ser usado automaticamente quando houver relacao laboral ou assimetria.

## Compartilhamento e infraestrutura

Os dados podem ser processados por Firebase/Google Cloud, Vercel e Sentry,
limitados aos servicos contratados. A controladora deve verificar regioes de
processamento, contratos, transferencias internacionais e mecanismos de
protecao aplicaveis.

## Retencao

- Dados operacionais: `[PRAZO DEFINIDO PELA ALTO VALE]`.
- Logs de auditoria: recomendacao inicial de 12 meses.
- Backups diarios: recomendacao inicial de 30 dias.
- Contas desativadas: excluir ou anonimizar apos o prazo legal/contratual.

Os prazos devem ser aprovados pela controladora e aplicados de forma
consistente.

## Direitos dos titulares

Solicitacoes de confirmacao, acesso, correcao, anonimização, eliminacao,
informacao e oposicao devem ser encaminhadas ao contato de privacidade. Antes
de atender, a controladora deve validar identidade, obrigacoes de conservacao e
impacto sobre direitos de terceiros.

## Seguranca

- Acesso por e-mail e senha com recuperacao individual.
- Perfis admin e gestor, usuario ativo e isolamento por base.
- Regras do Firestore testadas e publicadas.
- Monitoramento de erros sem PII por padrao.
- Backup, revisao de acessos e resposta a incidentes.

## Incidente de dados

Suspeitas de acesso indevido, perda ou alteracao devem ser comunicadas
imediatamente ao canal `[CANAL DE INCIDENTES]`. A controladora avalia risco aos
titulares e eventual comunicacao a ANPD e aos titulares.
