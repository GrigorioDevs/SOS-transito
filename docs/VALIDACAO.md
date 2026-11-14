# Validação da base inicial

Preparação em 29/10/2026. Este arquivo diferencia verificações executadas de
verificações que dependem do ambiente local do desenvolvedor.

## Executado com resultado positivo

- Instalação/restauração das dependências npm a partir do lockfile.
- Build de cliente, parceiro e admin com Vite 8.3.5.
- Geração de manifest/service worker para cliente e parceiro.
- Restauração NuGet em locked mode e compilação de Domain, Infra e API.
  SDK usado: 10.0.403; compilação com -m:1 neste ambiente, sem warnings/erros.
- Geração da migration InicialCatalogo pelo EF Core 10.0.14.
- Geração do SQL de revisão em infra/db/migration-preview.sql, sem aplicá-lo.
- Inicialização local da API em Development.
- GET /health/live retornou 200.
- GET /openapi/v1.json retornou 200 e descreveu /api/servicos e os healthchecks.
- Sintaxe bash do script de inicialização do banco verificada com bash -n.
- PDF renderizado e revisado; sumário e marcadores dos 33 capítulos presentes.

## Ainda precisa ser confirmado na sua máquina

- Subida do PostgreSQL/PostGIS, inicialização das roles, grants e volume.
- Aplicação da migration e consulta real aos cinco registros.
- Execução dos scripts PowerShell no Windows.
- Navegação em navegador e instalação do PWA em dispositivos reais.

Docker não está disponível no ambiente de preparação. No teste da API sem banco,
/health/ready retornou 503 e /api/servicos retornou 500, como era esperado para a
ausência dessa dependência. Isso não constitui teste de integração bem-sucedido
com PostgreSQL. O README contém a sequência para concluir essa validação.

## Dependências e segurança

npm audit apontou quatro entradas de baixa severidade na cadeia de build do PWA:
deepmerge, @rollup/plugin-node-resolve, workbox-build e vite-plugin-pwa. Elas se
relacionam ao advisory GHSA-gcqx-w48m-w2h4 sobre prototype poisoning em deepmerge.
São avisos da cadeia de dependências, não quatro incidentes observados no app.

A versão estável de deepmerge consultada foi 4.3.1. A sugestão automática do audit
envolvia regredir vite-plugin-pwa para 0.2.1; ela não foi aplicada por quebrar a
linha de ferramentas usada neste projeto. Não execute npm audit fix --force
indiscriminadamente. Antes de publicar, revise a cadeia atualizada e confirme
uma correção compatível ou substitua a geração PWA por uma opção revisada.

Referência: https://github.com/advisories/GHSA-gcqx-w48m-w2h4

O exemplo não contém Identity/JWT, gateway, mapa ou SignalR em operação. As
dependências desses módulos serão adicionadas quando eles forem implementados.
A API expõe apenas catálogo público de leitura e verificação local de saúde.
O bloqueio de ambiente Development ajuda a evitar publicação acidental, mas não
substitui o trabalho de autorização e proteção exigido para o produto completo.

## Verificação de aceite do primeiro marco

1. Execute o README com Docker Desktop aberto.
2. Confirme o usuário sos_app sem privilégios administrativos.
3. Confira cinco linhas em public.servicos pelo DBeaver.
4. Consulte GET /api/servicos e compare o JSON com os registros.
5. Abra o cliente e veja os mesmos cinco serviços.
6. Pare a API: a interface deve apresentar erro; reinicie e tente novamente.
7. Confirme que .env é ignorado pelo Git antes do primeiro commit.

Sem concluir esses passos, considere a instalação local em andamento.
