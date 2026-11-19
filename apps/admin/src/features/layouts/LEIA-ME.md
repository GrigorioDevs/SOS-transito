# Painel do Admin

Painel de governança do SOS Trânsito, no layout **Central Noturna**.
Funciona com **dados fictícios**, sem precisar do back-end. A única exceção é a aba Configurações › Serviços, que chama `GET /api/servicos`.

## Como abrir

```powershell
npm run dev:admin
```

Abra http://127.0.0.1:5175/

## Telas

| Rota | Tela | O que dá para fazer |
|---|---|---|
| `/visao-geral` | Visão geral | Semáforo geral, cartões por setor (Moderação, Atendimento, Satisfação, Retenção), KPIs, gráficos, denúncias mais urgentes com decisão, reincidentes |
| `/denuncias?caso=ID` | Denúncias | Fila por situação (abertos, fora do prazo, aguardando defesa, 2ª aprovação, resolvidos), busca, filtros, detalhe com provas, prazos gravados, decisão e histórico; **Simular nova denúncia** |
| `/usuarios?usuario=ID` | Usuários | Busca paginada, filtro por tipo e status, perfil com sanções, denúncias e avaliações; advertir, suspender, bloquear, reativar |
| `/bloqueios?aba=…` | Bloqueios | Ativos, aguardando 2ª aprovação (aprovar/recusar), recursos (aceitar/negar), reverter, histórico |
| `/retencao` | Retenção | Entradas × saídas, churn com meta, motivos de saída, quem saiu |
| `/avaliacoes?aba=…` | Avaliações | Fila de revisão, distribuição das notas, satisfação e insatisfação com meta; manter, ocultar, republicar |
| `/auditoria` | Auditoria | Quem, quando, o quê e por quê (inclui alterações de configuração); filtros e **Exportar CSV** |
| `/configuracoes?aba=…` | Configurações | Prazos, categorias, sanções, provas, metas, retenção, organização, serviços, histórico |

O menu lateral e a barra inferior do celular usam a mesma lista de itens: [`features/painel/menu.ts`](../painel/menu.ts). Os selos do menu mostram as pendências (denúncias abertas, bloqueios ou recursos para decidir e avaliações para revisar).

## Camada de dados

As telas **nunca** importam o mock. Toda leitura e escrita passa por `src/api/hooks.ts` (TanStack Query).

```
src/api/
├── tipos.ts          # contrato dos dados (depois: gerado do OpenAPI)
├── hooks.ts          # ÚNICO ponto que as telas usam
├── casos.ts  usuarios.ts  sancoes.ts  avaliacoes.ts  retencao.ts  painel.ts  auditoria.ts
│                     # API FICTÍCIA ← na troca pelo back-end, só estes mudam (fetch)
├── nucleo.ts         # regras do "servidor": auditoria, vencimentos, sanções, 2ª aprovação
├── dominio.ts        # funções puras: abrir caso (snapshot de prazos), pedir defesa, status do usuário
├── seed.ts           # dados de demonstração, com datas RELATIVAS a agora
└── armazenamento.ts  # localStorage com versão de esquema e mescla com os dados padrão
```

- **localStorage** (`sos-admin:dados`): guarda `{ esquema, salvoEm, banco }`. Ao carregar, o que foi salvo é mesclado com os dados padrão. Se o esquema mudar, a demonstração é recriada.
- **Datas relativas**: ao reabrir, todas as datas andam o tempo que o painel ficou fechado. Assim, um caso aberto "há 3 dias" continua "há 3 dias" amanhã. Com o painel aberto, o tempo passa normalmente e os prazos vencem.
- **Restaurar**: clique no avatar (canto superior) › *Restaurar dados de demonstração*. As configurações não são apagadas.
- **Estado de erro**: rode `localStorage.setItem('sos-admin:simular-falha', '1')` no console e recarregue. Todas as telas mostram o erro com "Tentar novamente". Para voltar, use `localStorage.removeItem('sos-admin:simular-falha')`.

## Regras

- **Nada fixo no código.** Prazos, limites, sanções, notas, metas, motivos e dias sem uso vêm de `useConfiguracoes()` (`src/config/`).
- **Prazos não são retroativos.** Ao abrir, o caso grava `nivelId`, `versaoConfig` e os prazos do nível. O pedido de defesa usa os prazos gravados. A sanção grava o prazo de recurso ao ser aplicada. **As metas do semáforo valem na hora.**
- **Ações críticas** (decidir, pedir defesa, arquivar, sancionar, reativar, reverter, aprovar/recusar, recurso, moderar avaliação) pedem justificativa com o mínimo configurado e confirmação, mostram um toast e geram registro na auditoria.
- **Procedente** é qualquer sanção aplicada e não revertida (arquivar não conta).
- **Bloqueio permanente com 2º admin:** fica "Aguardando 2ª aprovação". Se o pedido foi seu, a aprovação é simulada em nome da Marina. Se foi da Marina (há um exemplo em Bloqueios), você aprova.
- **Saiu do app** = último uso há mais de X dias (Configurações › Retenção).
- **Contagem dos prazos:** prazo em horas conta sempre em horas corridas. Dias úteis são de segunda a sexta (feriados ainda não entram).

## Roteiro de demonstração

1. **Visão geral**: o semáforo geral aparece em vermelho por causa do churn de prestadores. Clique num setor para abrir a tela dele.
2. **Configurações › Metas**: suba o limite do churn de prestadores e salve. O semáforo muda na hora.
3. **Configurações › Prazos**: mude o prazo de decisão do nível Médio e salve. Em **Denúncias**, os casos antigos continuam iguais. Clique em *Simular nova denúncia*: o caso novo já vem com o prazo novo (versão da configuração no detalhe).
4. **Denúncias › D-221**: a reincidência sugere "Suspensão 7 dias". Aplique com justificativa. Rafael aparece como suspenso em **Usuários** e em **Bloqueios**.
5. **Bloqueios › Aguardando 2ª aprovação**: aprove ou recuse. Em **Ativos**, analise o recurso do Vinícius Prado.
6. **Avaliações › Para revisar**: mantenha ou oculte. Em Configurações, mude a "nota de alerta" para 2 e a fila cresce.
7. **Auditoria**: tudo o que foi feito aparece com quem, quando, o quê e por quê. Exporte em CSV.
8. Recarregue a página: tudo continua igual.

## Quando ligar no back-end

1. Troque o corpo das funções de `src/api/*.ts` (menos `hooks.ts`) e de `src/config/api.ts` por chamadas `fetch`, mantendo as assinaturas. `nucleo.ts`, `dominio.ts`, `seed.ts` e `armazenamento.ts` deixam de ser usados.
2. Gere `src/api/tipos.ts` a partir do OpenAPI.
3. As telas e os hooks não precisam mudar.

O painel de **Operação** (chamados ao vivo) continua em `mock/` e ainda não tem rota.
