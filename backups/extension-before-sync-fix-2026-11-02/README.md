# Alto Vale - Sincronizador de Rotas

Extensao Chrome de uso manual para importar somente metricas agregadas do
painel operacional.

> Ferramenta independente de uso interno, nao afiliada, homologada ou
> patrocinada pelo Mercado Livre. Seu uso depende das permissoes da conta e das
> condicoes contratuais da operacao.

## Instalar

1. Abra `chrome://extensions`.
2. Ative o `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactacao`.
4. Selecione a pasta `extension`.
5. Abra `https://envios.adminml.com` e entre normalmente.
6. Abra `https://gestaoalto.com.br`.
7. No sistema Alto Vale, abra `Metricas` e clique em
   `Sincronizar rotas do dia`.

Antes de sincronizar, abra o popup da extensao para conferir se o painel esta
aberto e quantas rotas foram capturadas. Se aparecer `0`, recarregue o
monitoramento do Mercado Livre e aguarde a lista carregar.

## Privacidade

A extensao nao le, armazena ou transmite cookies e tokens. A resposta detalhada
e reduzida dentro da aba do painel antes de ser enviada ao sistema. Somente
estes campos saem da aba:

- ID da rota
- nome do motorista
- cluster
- placa
- status
- total de pacotes
- entregues
- pendentes
- insucessos
- quantidade de paradas

## Permissoes da conta

A extensao funciona com qualquer login do Mercado Livre que tenha acesso ao
painel `envios.adminml.com` e permissao para ver as rotas consultadas. Ela nao
usa uma conta fixa da Alto Vale e nao amplia permissoes: se o usuario logado nao
consegue abrir uma rota no painel, a sincronizacao dessa rota tambem nao deve
funcionar.

Use somente com autorizacao da operacao e respeitando as permissoes da conta.
