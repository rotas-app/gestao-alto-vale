# Alto Vale - Sincronizador de Rotas

Extensao Chrome de uso manual para importar somente metricas agregadas do
painel operacional.

## Instalar

1. Abra `chrome://extensions`.
2. Ative o `Modo do desenvolvedor`.
3. Clique em `Carregar sem compactacao`.
4. Selecione a pasta `extension`.
5. Abra `https://envios.adminml.com` e entre normalmente.
6. No sistema Alto Vale, abra `Metricas` e clique em
   `Sincronizar rotas do dia`.

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

Use somente com autorizacao da operacao e respeitando as permissoes da conta.
