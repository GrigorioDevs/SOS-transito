# SOS Trânsito - primeiro marco

Base inicial para aprender a stack do plano: JavaScript/React/Vite/MUI,
ASP.NET Core 10, EF Core 10 e PostgreSQL 16/PostGIS.

## Comece aqui

Leia docs/GUIA_DO_ZERO.md (33 capítulos, comandos, arquitetura, sintaxe e glossário).
Instale Node.js 24 LTS, .NET 10 SDK, Git, VS Code e Docker Desktop com Linux containers.
Extraia este projeto para C:\Projetos\sos-transito e abra essa pasta no VS Code.
Todos os comandos abaixo partem da raiz, onde estão package.json e compose.yaml.

```powershell
npm ci
dotnet restore backend/Sos.slnx --locked-mode
dotnet tool restore
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\configurar-local.ps1
docker compose pull
docker compose up -d --wait
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\migrar.ps1
```

O uso de Bypass é limitado ao processo acima. Você pode inspecionar os scripts antes.
O primeiro script gera senhas locais sem sobrescrever .env existente e configura
User Secrets. O segundo aplica a migration inicial já incluída.

Terminal 1:

```powershell
dotnet run --project backend/Sos.Api --launch-profile http
```

Terminal 2:

```powershell
npm run dev:cliente
```

Abra http://127.0.0.1:5173. Devem aparecer cinco serviços vindos do banco.
Para os outros aplicativos, abra terminais separados:

```powershell
npm run dev:parceiro
npm run dev:admin
```

Parceiro: http://127.0.0.1:5174. Admin: http://127.0.0.1:5175.
API: http://127.0.0.1:5080/api/servicos.
Contrato: http://127.0.0.1:5080/openapi/v1.json.
Banco local: 127.0.0.1:55432 / sos_transito_dev.

## O que existe

- Três aplicações React em JavaScript com tema branco/preto e cores de status.
- Componentes visuais e cliente HTTP compartilhados via npm workspaces.
- Tratamento de carregamento, falha, vazio e tentativa novamente.
- API somente de leitura do catálogo público; DTO e EF Core.
- Migration com cinco serviços e preparação de PostGIS.
- Usuário limitado de leitura para a API e credencial separada para migrations.
- PWA da interface estática para cliente/parceiro no build, sem cache de API.
- Versões registradas em manifests e lockfiles.

## O que será construído depois

Login/Identity/JWT, veículos, cadastro e aprovação de parceiros, chamados,
matching, mapas/rotas, SignalR, chat, uploads, pagamentos e repasses.
As telas presentes não afirmam executar esses serviços. O backend recusa iniciar
fora de Development. Leia docs/VALIDACAO.md antes de usar a base.

## Compilar

```powershell
npm run build
dotnet build backend/Sos.slnx
```

Se a compilação .NET falhar sem diagnóstico em um ambiente restrito, tente -m:1.
Os arquivos infra/db/migration-preview.sql são para revisão; o caminho de execução
é migrar.ps1. Não aplique o mesmo histórico por dois caminhos diferentes.

## Parar sem apagar os dados

Encerre API/Vite com Ctrl+C e use docker compose stop para parar o banco.
Não adicione -v a docker compose down sem decidir conscientemente apagar o volume.
Não envie .env, User Secrets, node_modules, bin ou obj para outra pessoa.

As referências são o PDF e os prints enviados pelo usuário. Os prints não estão
reproduzidos no pacote. Dados pessoais, imagens, placa e valores dos exemplos
visuais não foram copiados para a aplicação.
