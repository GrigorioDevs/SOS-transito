# SOS Trânsito: do zero ao primeiro fluxo funcionando

Guia de implementação e estudo • edição de 29/10/2026

Base: PDF SOS_Transito_Plano_do_Projeto(1).pdf, especialmente páginas 2 a 12, e os sete prints enviados. Ambiente didático: Windows, PowerShell e VS Code. A publicação futura pode ocorrer em Linux. Front-end em JavaScript, como solicitado.

## 1. O resultado que vamos buscar primeiro

Você não precisa entender todas as tecnologias antes de escrever a primeira linha. Precisa compreender um caminho completo: o navegador pede uma informação, a API consulta o banco, o banco responde e a tela apresenta o resultado.

O primeiro marco é listar os cinco serviços do PDF: borracheiro, elétrica, pane seca, guincho e chaveiro. Esse fluxo pequeno já exercita React, HTTP, ASP.NET Core, EF Core e PostgreSQL. Ele também permite descobrir cedo erros de instalação, porta, conexão e consulta.

O kit entregue implementa esse marco. Há três aplicações com telas iniciais e catálogo, um tema compartilhado, uma API de consulta, configuração do PostgreSQL/PostGIS, migration inicial e scripts locais. Solicitação de socorro, contas, pagamentos, mapas e SignalR serão módulos seguintes. Não há autenticação ou operação comercial pronta nesta etapa. A API do kit recusa execução fora de Development para evitar publicação acidental.

O projeto completo é um monólito modular: uma API implantável, dividida por assuntos. O repositório é um monorepo: um repositório Git contém os três fronts, os pacotes compartilhados e o backend. Três aplicações visuais não exigem três bancos ou três APIs.

**Exercício:** explique em voz alta quem mostra a tela, quem decide a regra e quem guarda os dados. Resposta esperada: front-end, backend e banco, respectivamente.

## 2. A stack do PDF, com versões adequadas para começar

Mantemos as tecnologias do documento. Atualizamos .NET/ASP.NET Core e EF Core de 8 para 10, porque o suporte do .NET 8 termina em 10/11/2026. O .NET 10 é LTS, com suporte até novembro de 2028 [1]. PostgreSQL 16 continua suportado e foi mantido [2]. React 19 atende à indicação React 18+ do PDF.

| Peça | O que é | Papel no SOS Trânsito |
| --- | --- | --- |
| HTML | Linguagem de marcação | Define elementos como títulos, campos e botões. |
| CSS | Linguagem de estilos | Controla cor, espaço, alinhamento e adaptação à tela. |
| JavaScript | Linguagem de programação | Reage a cliques, manipula dados e chama a API. |
| React 19 | Biblioteca de interfaces | Monta telas com componentes reutilizáveis. |
| Vite 8 | Ferramenta de desenvolvimento e build | Executa o front localmente e gera os arquivos de publicação. |
| Material UI 7 | Biblioteca de componentes React | Fornece campos, cartões, diálogos, botões e tema. |
| Emotion 11 | Dependência de estilos do MUI | Ajuda o MUI a transformar estilos em CSS. |
| React Router 7 | Biblioteca de navegação | Associa uma URL, como /servicos, a uma tela. |
| TanStack Query 5 | Biblioteca de dados remotos | Controla consulta, carregamento, erro e atualização do catálogo. |
| C# | Linguagem de programação | Implementa as regras e os endpoints do backend. |
| .NET 10 SDK | Plataforma e ferramentas | Compila e executa projetos C#. |
| ASP.NET Core 10 | Framework web do .NET | Recebe HTTP, executa endpoints e produz respostas. |
| EF Core 10 | ORM | Mapeia classes para tabelas e traduz consultas para SQL. |
| Npgsql 10 | Driver/provedor PostgreSQL | Permite que .NET e EF Core se comuniquem com PostgreSQL. |
| PostgreSQL 16 | Sistema gerenciador de banco | Guarda usuários, veículos, chamados e pagamentos. |
| PostGIS | Extensão do PostgreSQL | Acrescenta tipos e operações geográficas. |
| NetTopologySuite | Biblioteca espacial .NET | Representa pontos e outras formas no código C#. |
| SignalR | Recurso de tempo real do ASP.NET Core | Entrega ofertas, posições, mensagens e mudanças de status. |
| Leaflet + dados OSM | Biblioteca de mapa + base geográfica | Mostram locais e parceiros; não substituem o backend. |
| ASP.NET Core Identity | Gerenciamento de contas | Organiza usuários, senhas protegidas, roles e recuperação. |
| JWT | Formato de token | Transporta informações assinadas sobre uma autenticação. |
| Quartz.NET | Agendador escolhido entre as opções do PDF | Executará expiração de ofertas e outros trabalhos programados. |
| Docker Compose | Descrição de serviços locais | Sobe PostgreSQL com configuração repetível. |

Node.js 24 LTS é a versão escolhida para executar ferramentas do front; não transforma seu backend em Node. O backend continua .NET. npm vem com Node e baixa pacotes JavaScript. NuGet cumpre função semelhante para pacotes .NET. MUI 7 e Router 7 são escolhas de versão deste kit; não são apresentados como as últimas versões existentes [3–6].

As versões exatas JavaScript estão nos package.json e package-lock.json. As versões .NET estão nos .csproj e packages.lock.json. Não misture EF Core 10 com um provedor Npgsql EF Core 8. Números de patch podem diferir entre fabricantes; a compatibilidade exigida pelo pacote é o que importa.

## 3. Como as partes conversam

O cliente, o parceiro e o administrador usam aplicações distintas. Todas enviam requisições para a mesma API. A API verifica identidade, permissão e regras, quando esses módulos forem implementados, e acessa o banco por EF Core/Npgsql. O navegador nunca recebe a senha do PostgreSQL.

No primeiro exercício: CatalogoPage usa listarServicos; listarServicos executa fetch('/api/servicos'); o Vite encaminha a chamada para a API local; CatalogoController consulta SosDbContext; o EF Core produz SQL; a resposta JSON retorna à tela. O componente ServiceCard apresenta cada registro.

| Caminho | Quem participa | O que circula |
| --- | --- | --- |
| Consulta normal | Navegador, API e banco | HTTP/JSON entre navegador e API; SQL entre API e banco. |
| Tempo real, depois | Navegador e SocorroHub | Eventos sobre um chamado autorizado. |
| Pagamento, depois | API e gateway | Criação da cobrança e confirmação por webhook. |
| Upload, depois | API e armazenamento privado | Arquivo validado e referência controlada no banco. |

Dentro do backend, Sos.Domain guarda conceitos e regras; Sos.Infra implementa persistência e integrações; Sos.Api expõe HTTP e reúne as dependências. Domain não referencia API ou Infra. Infra referencia Domain. API referencia Infra e Domain. Quando os casos de uso crescerem, uma camada Sos.Application poderá concentrar a coordenação, sem necessidade de criá-la agora.

Esta organização permite testar e evoluir assuntos separadamente. Não obriga criar um microserviço para cada assunto. Tampouco é necessário adicionar um repository genérico sobre toda operação do DbContext logo no início.

## 4. Preparar o computador

Use o Windows com PowerShell para seguir os comandos deste material. Abra o terminal integrado do VS Code em Terminal > Novo Terminal. Não cole comandos PowerShell no SQL do DBeaver, nem SQL no terminal sem usar um cliente de banco.

| Instalar | Onde obter | Por que precisa |
| --- | --- | --- |
| VS Code | https://code.visualstudio.com/download | Editar arquivos e abrir terminais. |
| Git | https://git-scm.com/download/win | Registrar versões e colaborar. |
| Node.js 24 LTS | https://nodejs.org/en/download | Executar Vite/npm; escolher a linha 24. |
| .NET 10 SDK | https://dotnet.microsoft.com/download/dotnet/10.0 | SDK compila; instalar apenas Runtime não basta. |
| Docker Desktop | https://docs.docker.com/desktop/setup/install/windows-install/ | Executar o banco em container Linux. |
| DBeaver Community | https://dbeaver.io/download/ | Inspecionar o PostgreSQL visualmente. |

No VS Code, instale as extensões C# da Microsoft e, se desejar, C# Dev Kit. O editor não substitui o SDK. Para o Docker Desktop, habilite o backend WSL 2 e use Linux containers. Se o Windows ainda não tiver WSL, siga o instalador oficial; o comando wsl --install normalmente exige terminal como administrador e reinicialização. Abra o Docker Desktop antes de tentar subir o banco [7].

Feche e reabra o terminal após instalar. Execute:

```powershell
node --version
npm --version
dotnet --list-sdks
git --version
docker --version
docker compose version
docker info
```

Node deve informar v24.x, e a lista de SDKs precisa conter 10.0.x. docker info deve conseguir consultar o servidor Docker. Ver apenas a versão do cliente Docker não prova que o motor está funcionando.

Se aparecer que npm.ps1 não pode ser carregado por política de execução, use npm.cmd no lugar de npm. Não precisa reduzir permanentemente a segurança do PowerShell para executar npm.

## 5. Criar sua pasta de trabalho

Crie C:\Projetos. Extraia o ZIP entregue nessa pasta. A pasta final esperada é C:\Projetos\sos-transito, contendo package.json, compose.yaml, apps e backend. Se o descompactador criar uma pasta externa adicional, entre na pasta que realmente contém package.json.

```powershell
New-Item -ItemType Directory -Force C:\Projetos
Set-Location C:\Projetos\sos-transito
Get-ChildItem
code .
```

New-Item cria um item; -ItemType Directory pede uma pasta; -Force permite que a pasta já exista. Set-Location muda a pasta atual. Get-ChildItem lista seu conteúdo. O ponto em code . significa “abrir a pasta atual”.

Não execute agora os comandos de recriação do capítulo 18: eles são um percurso alternativo para estudar a origem dos arquivos. O caminho principal é usar o kit e entender uma peça por vez.

**Validação:** no Explorer do VS Code, você deve enxergar apps, backend, packages, docs, scripts e infra no mesmo nível.

## 6. Entender os diretórios

| Diretório | Responsabilidade | Exemplos |
| --- | --- | --- |
| apps/cliente | Interface usada pelo motorista | Início, serviços; depois pedido, acompanhamento e veículos. |
| apps/parceiro | Interface do prestador | Início, serviços; depois ofertas, disponibilidade e ganhos. |
| apps/admin | Interface de administração | Catálogo; depois operação, aprovação e financeiro. |
| packages/ui | Aparência compartilhada | theme.js e ServiceCard. |
| packages/api-client | Comunicação compartilhada com API | listarServicos e tratamento HTTP básico. |
| backend/Sos.Api | Entrada HTTP | Program.cs, controllers, contratos e configuração. |
| backend/Sos.Domain | Conceitos do negócio | Servico; depois Chamado, Veiculo e regras. |
| backend/Sos.Infra | Acesso a dados | DbContext, mapeamento, migrations e integrações futuras. |
| backend/Sos.Tests | Planejamento dos testes seguintes | Um LEIA-ME; ainda não é projeto de testes executável. |
| infra/db | Preparação do banco local | Criação do usuário limitado da API. |
| scripts | Comandos repetitivos | Configurar segredos locais e aplicar migrations. |
| docs | Conhecimento do projeto | Guia, arquitetura, decisões e plano de evolução. |

| Arquivo | O que significa |
| --- | --- |
| package.json da raiz | Define workspaces e atalhos de execução dos três fronts. |
| package-lock.json | Registra as versões JavaScript resolvidas de todo o monorepo. |
| compose.yaml | Define imagem, volume, portas e variáveis do banco. |
| .env.example | Mostra nomes de configurações sem incluir senhas. |
| .env | Guarda valores locais; é gerado e ignorado pelo Git. |
| .gitignore | Diz quais arquivos não devem entrar nos commits. |
| .editorconfig | Padroniza codificação, indentação e fim de arquivo. |
| backend/Sos.slnx | Agrupa projetos .NET em uma solução. |
| *.csproj | Descreve alvo .NET, pacotes e referências de cada projeto. |
| packages.lock.json | Registra as dependências NuGet resolvidas. |
| dotnet-tools.json | Registra a ferramenta local dotnet-ef. |

node_modules, bin, obj e dist são gerados por ferramentas. Você normalmente não edita esses diretórios. Migrations, arquivos .cs, .jsx, .js, configurações e lockfiles fazem parte do código versionado.

## 7. Baixar as dependências

Na raiz C:\Projetos\sos-transito:

```powershell
npm ci
dotnet restore backend/Sos.slnx --locked-mode
dotnet tool restore
```

npm ci instala exatamente as dependências descritas no lockfile e recria node_modules. Ele é adequado para o kit já entregue e para os demais integrantes do grupo. npm install é usado quando você adiciona ou atualiza pacotes e precisa atualizar o lockfile. Não apague o lockfile apenas para resolver um conflito sem entender a causa.

dotnet restore baixa pacotes NuGet. --locked-mode exige que a restauração respeite os lockfiles e falha se os arquivos de projeto pedirem algo diferente. dotnet tool restore instala a versão de dotnet-ef registrada no manifesto local, sem depender de uma instalação global de outra versão.

O kit já usa React, MUI/Emotion, Router, Query e Vite/PWA. Não é necessário executar npm install separadamente em cada aplicativo: os workspaces são tratados a partir da raiz. A API já usa EF/Npgsql e a configuração espacial. Os módulos que ainda não existem terão suas dependências adicionadas na etapa correspondente.

**Validação:** npm run build deve gerar dist para os três apps. dotnet build backend/Sos.slnx deve compilar Domain, Infra e API. Se houver erro, resolva antes de avançar para banco e login.

## 8. Configurar os segredos locais

Execute na raiz:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\configurar-local.ps1
```

O script gera duas senhas aleatórias e cria .env somente se ele ainda não existe. Depois registra a connection string da API com dotnet user-secrets. Ele não muda seu ambiente HML/PRD nem acessa a VPS.

-NoProfile inicia uma sessão sem carregar personalizações. -File informa o arquivo a executar. -ExecutionPolicy Bypass vale para esse processo, permitindo executar o script que você recebeu; não altera a política permanente do Windows. Leia scripts antes de executá-los.

O proprietário local do banco chama-se sos_owner e aplica migrations. A API usa sos_app, que nesta etapa recebe apenas leitura das tabelas criadas pelo proprietário. Isso ensina a separar mudança de estrutura de uso normal da aplicação. A credencial administrativa automática do container é para desenvolvimento local; em produção, use um proprietário/migrador sem privilégios administrativos desnecessários.

User Secrets mantém o segredo fora do código, mas não é um cofre criptografado. Serve para desenvolvimento. A pasta .env também contém texto simples e não deve ser compartilhada ou commitada [8]. O ZIP não traz senhas de banco, tokens ou credenciais da sua VPS.

Importante: ASP.NET Core não lê automaticamente o .env do Docker Compose. O script configura duas coisas distintas: variáveis do container e User Secrets da API. Essa diferença evita um erro comum de “a senha está no arquivo, mas a API não enxerga”.

## 9. Subir PostgreSQL e PostGIS

Com Docker Desktop aberto, execute na raiz:

```powershell
docker compose pull
docker compose up -d --wait
docker compose ps
docker compose logs --tail 80 db
```

pull baixa a imagem. up cria/inicia o serviço. -d significa executar em segundo plano. --wait aguarda o serviço ficar pronto conforme o healthcheck. ps mostra o estado e logs mostra as últimas mensagens.

| Configuração | Valor do kit | Significado |
| --- | --- | --- |
| Imagem | postgis/postgis:16-3.5 | PostgreSQL 16 com PostGIS 3.5. |
| Serviço Compose | db | Nome interno do serviço. |
| Container local | sos_transito_db_dev | Instância separada do container da VPS. |
| Banco | sos_transito_dev | Base exclusiva de desenvolvimento. |
| Porta no Windows | 55432 | Porta usada pela API e pelo DBeaver. |
| Porta no container | 5432 | Porta padrão interna do PostgreSQL. |
| Publicação | 127.0.0.1:55432:5432 | Acesso limitado à máquina local. |
| Volume | postgres_data | Mantém dados quando o container é recriado. |

A imagem é o modelo; o container é o processo executando esse modelo; o volume guarda os dados persistentes. docker compose down remove containers/rede, mas normalmente preserva o volume nomeado. Adicionar -v remove o volume e seus dados: não use como comando rotineiro de correção.

O script infra/db/01-app-user.sh roda somente na primeira inicialização de um volume vazio. Alterar .env depois não troca automaticamente senhas de usuários existentes. Se isso acontecer, ajuste as senhas conscientemente ou restaure a configuração original; não apague o banco sem verificar seu conteúdo [9].

## 10. Conectar pelo DBeaver

No DBeaver: Nova conexão > PostgreSQL. Não selecione SQLite. PostgreSQL e SQLite têm sintaxes e recursos diferentes; um CREATE USER do PostgreSQL não funciona numa conexão SQLite.

| Campo | Valor |
| --- | --- |
| Host | 127.0.0.1 |
| Porta | 55432 |
| Database | sos_transito_dev |
| Usuário | sos_owner, para inspecionar estrutura local |
| Senha | Valor de POSTGRES_PASSWORD no seu .env local |

Teste a conexão, abra um editor SQL dessa conexão e execute:

```sql
SELECT version();
SELECT current_database(), current_user;
SELECT PostGIS_Full_Version();
```

SELECT consulta informações. Os parênteses chamam funções. O ponto e vírgula encerra o comando. current_database() e current_user ajudam a confirmar que você está na base e no usuário corretos antes de executar alterações.

O PostGIS adiciona recursos ao PostgreSQL existente; ele não é outro banco separado. Seu primeiro catálogo não usa coordenadas, mas a infraestrutura já está preparada para o módulo geográfico.

## 11. Criar as tabelas com migrations

O kit contém a migration inicial do catálogo. Aplique-a:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\migrar.ps1
```

Uma migration é um histórico versionado de alteração do modelo. Seu Up descreve a aplicação da mudança; seu Down descreve uma reversão técnica. Uma reversão pode perder dados, por isso não deve ser usada automaticamente em produção.

O script chama dotnet ef database update, indicando o projeto que contém as migrations e o projeto de inicialização. A senha do proprietário é lida do .env local. A API continua configurada com o usuário de leitura. A factory SosDbContextFactory permite às ferramentas criar o contexto sem iniciar o servidor web.

Confira no DBeaver:

```sql
SELECT "Id", "Nome", "Descricao", "Ativo"
FROM public.servicos
ORDER BY "Id";
```

Devem aparecer cinco linhas. O EF preservou os nomes das propriedades C# nas colunas, por isso as aspas duplas em "Nome". PostgreSQL converte identificadores não delimitados para minúsculas. O nome da tabela, servicos, foi configurado explicitamente.

Quando você alterar o modelo no futuro, gere uma nova migration, revise o código e só então aplique. Exemplo de sintaxe:

```powershell
dotnet ef migrations add AdicionarVeiculos --project backend/Sos.Infra --startup-project backend/Sos.Api --output-dir Migrations
```

Esse comando só faz sentido depois de modelar Veiculo. Não execute agora apenas por estar no exemplo. migrations add gera arquivos; database update altera o banco. HasData, usado no catálogo, declara registros iniciais que o EF inclui na migration. Não confunda gerar uma migration com já ter aplicado a mudança [10].

## 12. Iniciar e verificar a API

Abra o primeiro terminal do VS Code na raiz:

```powershell
dotnet run --project backend/Sos.Api --launch-profile http
```

run compila e inicia a aplicação. --project seleciona o projeto executável. --launch-profile http usa a porta e o ambiente descritos em launchSettings.json. Mantenha esse terminal aberto. Ctrl+C encerra o servidor.

Em outro terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:5080/health/live
Invoke-RestMethod http://127.0.0.1:5080/health/ready
Invoke-RestMethod http://127.0.0.1:5080/api/servicos
```

live informa se o processo responde. ready verifica conexão com o banco; ele não comprova que todas as migrations foram aplicadas. /api/servicos comprova o acesso à tabela do catálogo. O contrato OpenAPI fica em http://127.0.0.1:5080/openapi/v1.json. É um documento JSON; não instalamos uma interface Swagger UI.

O catálogo é público e de leitura nesta fase. Os futuros endpoints pessoais precisarão autenticação e autorização antes de serem usados por pessoas reais. A porta é vinculada ao loopback. O HTTP desta etapa serve ao laboratório local; a publicação futura precisa de HTTPS.

## 13. Iniciar as três interfaces

Com API e banco ativos, abra um terminal por aplicação. Todos começam na raiz do projeto:

```powershell
# Terminal do cliente
npm run dev:cliente

# Em outro terminal: parceiro
npm run dev:parceiro

# Em outro terminal: administrador
npm run dev:admin
```

| Perfil | Endereço local |
| --- | --- |
| Cliente | http://127.0.0.1:5173 |
| Parceiro | http://127.0.0.1:5174 |
| Administrador | http://127.0.0.1:5175 |

Você pode iniciar somente o cliente no primeiro dia. Os outros apps usam o mesmo componente visual e a mesma API. As telas iniciais têm conteúdo parecido porque o objetivo atual é validar a estrutura; elas se especializarão quando seus módulos forem implementados.

O script npm run dev:cliente da raiz encaminha npm run dev ao workspace @sos/cliente. Nesse workspace, dev executa vite. A configuração usa strictPort: se a porta estiver ocupada, haverá erro em vez de mudar silenciosamente de endereço.

Cada Vite recebe /api e encaminha para 127.0.0.1:5080. Por isso o navegador conversa com a mesma origem de onde carregou a tela e o kit não precisa liberar CORS. Na publicação, esse encaminhamento será responsabilidade de um proxy como Nginx; o proxy de desenvolvimento do Vite não existe dentro do dist.

## 14. Entender o código do front

index.html contém o elemento root. main.jsx encontra esse elemento e monta o React. App.jsx associa caminhos a telas. CatalogoPage consulta a API. ServiceCard apresenta um item. theme.js controla as cores e estilos compartilhados.

Trecho do catálogo:

```jsx
const { data = [], isPending, isError } = useQuery({
  queryKey: ['servicos'],
  queryFn: ({ signal }) => listarServicos({ signal }),
  staleTime: 60_000,
});
```

const declara uma variável que não será reatribuída. As chaves à esquerda fazem desestruturação: extraem campos do objeto retornado. data = [] define uma lista vazia quando data ainda não existe. useQuery é um hook; ele integra a consulta ao ciclo do React. queryKey identifica a informação no cache. queryFn é a função que busca os dados. signal permite cancelar uma requisição que não é mais necessária.

staleTime: 60_000 significa que os dados permanecem considerados recentes por 60 segundos. Isso não é um temporizador que consulta a cada minuto. O caractere _ apenas facilita a leitura do número [6].

```jsx
data.map(s => (
  <ServiceCard key={s.id} nome={s.nome} descricao={s.descricao} />
))
```

map transforma cada registro em um componente. s é um parâmetro escolhido para representar um serviço. => declara uma função de seta. JSX permite escrever a descrição da interface dentro do JavaScript. {s.nome} insere uma expressão JavaScript no JSX. nome e descricao são props: dados enviados ao componente filho. key ajuda React a reconhecer cada item da lista e precisa ser estável.

Um componente é uma função que retorna uma descrição da interface. Uma página é um componente que representa uma tela inteira. Um hook é uma função que participa dos mecanismos de estado/efeitos do React e deve ser chamado no topo do componente ou de outro hook, não dentro de um if ou loop.

Exemplo de estado local, para estudar posteriormente:

```jsx
const [online, setOnline] = useState(false);
<Button onClick={() => setOnline(valor => !valor)}>
  {online ? 'Ficar offline' : 'Ficar online'}
</Button>
```

useState guarda um valor entre renderizações. setOnline solicita a atualização da tela. ! inverte um booleano. condição ? A : B escolhe um dos dois valores. Esse exemplo altera somente a tela; a disponibilidade real precisa ser registrada e validada pela API. Não confunda estado visual com dado confirmado no servidor.

## 15. Entender fetch, JSON e os estados da tela

```javascript
export async function listarServicos({ signal } = {}) {
  const response = await fetch('/api/servicos', { signal });
  if (!response.ok) {
    throw new Error('Não foi possível consultar os serviços.');
  }
  return response.json();
}
```

export permite importar a função em outro arquivo. async indica que a função retorna uma Promise, um resultado que pode chegar depois. await espera a operação assíncrona sem bloquear a interface. fetch faz uma requisição HTTP; sem method explícito, usa GET. response.ok é verdadeiro para status 200–299. throw interrompe o fluxo normal e entrega o erro ao chamador. response.json() interpreta o texto de resposta como dados JavaScript.

fetch não lança erro automaticamente para qualquer HTTP 400 ou 500; por isso verificamos response.ok. JSON é um formato de troca de dados, com campos e valores, como {"id":1,"nome":"Borracheiro"}. Não é uma tabela do banco nem código C#.

| Estado | O usuário deve ver | Como experimentar |
| --- | --- | --- |
| Carregando | Indicador e texto | Ative rede lenta no DevTools. |
| Sucesso | Lista de serviços | Mantenha banco e API ativos. |
| Vazio | Mensagem explicando ausência | Exercício futuro: serviço sem dados. |
| Erro | Mensagem útil e tentar novamente | Pare a API e recarregue. |

Abra F12 > Network e encontre /api/servicos. Examine URL, status e resposta. Isso ajuda a separar erro de interface, erro HTTP e erro de consulta. Evite apresentar stack traces ou senhas ao usuário.

## 16. Entender o backend, linha por linha

Program.cs é o ponto de entrada. WebApplication.CreateBuilder(args) prepara configuração e serviços. builder.Services registra dependências. AddDbContext informa como criar SosDbContext. UseNpgsql escolhe PostgreSQL; UseNetTopologySuite habilita tipos espaciais. AddControllers registra controllers. Build cria a aplicação. MapControllers publica suas rotas. Run inicia o servidor.

Injeção de dependência significa receber uma dependência pronta, em vez de criá-la em cada lugar. No controller, CatalogoController(SosDbContext db) pede um contexto ao ASP.NET Core. O DbContext é normalmente scoped: uma instância por escopo da requisição. Não o transforme em variável estática ou singleton, nem o compartilhe entre operações paralelas.

```csharp
[ApiController]
[Route("api/servicos")]
public sealed class CatalogoController(SosDbContext db)
    : ControllerBase
```

[ApiController] e [Route] são atributos: metadados que o framework interpreta. public permite acesso por outras partes do código. sealed impede herança dessa classe. class define uma classe. : ControllerBase indica herança. O parâmetro entre parênteses é um construtor primário, recurso da linguagem C#, usado aqui para receber o contexto.

```csharp
public async Task<ActionResult<List<ServicoResponse>>> Listar(
    CancellationToken cancellationToken)
```

Leia de dentro para fora: ServicoResponse é o DTO de um item; List contém vários itens; ActionResult representa uma resposta HTTP que pode carregar essa lista; Task representa a conclusão futura da operação. async permite usar await. CancellationToken permite propagar a interrupção da requisição para a consulta.

Na entidade, public string Nome { get; set; } = string.Empty define uma propriedade de texto. get permite ler, set permite atribuir, e string.Empty evita iniciar com null. bool guarda true/false. int guarda inteiro. namespace organiza nomes. using importa um namespace; não instala pacote.

Um DTO controla o contrato da API. Ele impede que você exponha automaticamente todos os campos da entidade. No futuro, senhas, documentos internos e flags administrativas não devem sair apenas porque existem na tabela.

## 17. Entender EF Core e a consulta

```csharp
var servicos = await db.Servicos
    .AsNoTracking()
    .Where(s => s.Ativo)
    .OrderBy(s => s.Id)
    .Select(s => new ServicoResponse(s.Id, s.Nome, s.Descricao))
    .ToListAsync(cancellationToken);
```

db.Servicos é um DbSet, a porta de acesso às entidades de serviço. AsNoTracking evita manter rastreamento de mudanças que não serão salvas nessa consulta. Where filtra. OrderBy ordena. Select escolhe os campos da resposta. ToListAsync executa a consulta e materializa o resultado em memória.

Até a execução, o EF monta uma expressão que pode traduzir para SQL. Ele não precisa trazer toda a tabela para então filtrar em JavaScript. Ainda assim, ORM não elimina a necessidade de índices, limites, paginação e análise de SQL. O plano de execução continua sendo decisão do PostgreSQL.

No OnModelCreating: ToTable escolhe a tabela; HasKey define chave primária; HasMaxLength limita o campo; IsRequired exige valor; HasIndex(...).IsUnique cria unicidade. A restrição no banco protege contra duplicidade mesmo com requisições simultâneas.

O kit não usa EnsureCreated junto de migrations. Em produção, migrations precisam ser revisadas e aplicadas por um passo controlado, com backup e estratégia de reversão. Não deixe cada réplica da API tentando alterar a estrutura ao iniciar.

**Exercício:** mude somente a ordem da consulta para OrderBy(s => s.Nome), execute novamente a API e confira a tela. Não é necessária migration porque a estrutura da tabela não mudou.

## 18. Como esses projetos seriam criados numa pasta vazia

Este capítulo é uma alternativa de estudo. Não rode novamente sobre o kit. Crie outra pasta, como C:\Projetos\sos-transito-laboratorio, se quiser reproduzir a montagem.

```powershell
mkdir sos-transito-laboratorio
cd sos-transito-laboratorio
git init
npm init -y
npm create vite@latest apps/cliente -- --template react
npm create vite@latest apps/parceiro -- --template react
npm create vite@latest apps/admin -- --template react
```

mkdir cria uma pasta; cd entra nela. git init inicia o histórico local. npm init -y gera um package.json com respostas padrão. npm create chama um gerador. vite@latest solicita o gerador estável disponível naquele momento. O separador -- encaminha os argumentos seguintes ao gerador. --template react escolhe JavaScript/JSX; react-ts escolheria TypeScript, que não é o requisito deste projeto.

Depois, configure private e workspaces no package.json da raiz, normalize os nomes dos aplicativos e crie packages/ui e packages/api-client. O kit mostra os arquivos completos. Sem definir os workspaces, executar npm na raiz não organiza automaticamente os três projetos.

```powershell
dotnet new sln -n Sos -o backend --format slnx
dotnet new classlib -n Sos.Domain -o backend/Sos.Domain -f net10.0
dotnet new classlib -n Sos.Infra -o backend/Sos.Infra -f net10.0
dotnet new webapi -n Sos.Api -o backend/Sos.Api -f net10.0 --use-controllers
dotnet sln backend/Sos.slnx add backend/Sos.Domain
dotnet sln backend/Sos.slnx add backend/Sos.Infra
dotnet sln backend/Sos.slnx add backend/Sos.Api
dotnet add backend/Sos.Infra reference backend/Sos.Domain
dotnet add backend/Sos.Api reference backend/Sos.Infra
dotnet add backend/Sos.Api reference backend/Sos.Domain
```

new escolhe um template. sln cria a solução. classlib cria uma biblioteca de classes, sem servidor próprio. webapi cria um projeto web. -n escolhe o nome; -o escolhe a pasta de saída; -f escolhe o framework alvo. reference cria uma dependência entre projetos, não uma cópia de arquivos.

Os templates podem conter exemplos como WeatherForecast e configurações diferentes do kit. Ajuste-os para o catálogo e confira Program.cs, portas e launchSettings.json. O gerador cria a estrutura técnica; ele não conhece as regras do SOS Trânsito.

| Comando/ação | Onde | O que modifica |
| --- | --- | --- |
| npm install pacote --workspace @sos/cliente | Raiz | package.json do cliente e lockfile. |
| npm install -D pacote --workspace @sos/cliente | Raiz | Dependência usada pelas ferramentas de desenvolvimento. |
| dotnet add backend/Sos.Infra package Nome --version '10.0.*' | Raiz | Referência NuGet no .csproj de Infra. |
| dotnet new tool-manifest | Raiz | Manifesto de ferramentas locais. |
| dotnet tool install dotnet-ef --version '10.0.*' | Raiz | Ferramenta EF da família 10; registre a versão resolvida. |

O asterisco de versão é útil na seleção inicial de patches, mas a base entregue registra versões e lockfiles concretos. Para atualizar depois, revise o pacote, atualize o lock e compile novamente. Não atualize automaticamente todos os majors ao mesmo tempo.

## 19. Dependências por etapa: instalar quando houver uso

| Etapa | Dependência | Projeto e motivo |
| --- | --- | --- |
| Já incluída | @mui/material e @emotion/* | UI e apps: componentes e estilos. |
| Já incluída | @mui/icons-material | Apps: ícones consistentes. |
| Já incluída | @tanstack/react-query | Apps: dados remotos e estados da consulta. |
| Já incluída | react-router | Apps: navegação por URL. |
| Já incluída | vite, @vitejs/plugin-react | Apps: execução local e compilação JSX. |
| Já configurada em cliente/parceiro | vite-plugin-pwa | Build: manifest, ícones e cache da interface. |
| Já incluída | Npgsql.EntityFrameworkCore.PostgreSQL | Infra: provider EF para PostgreSQL. |
| Já incluída | Npgsql.EntityFrameworkCore.PostgreSQL.NetTopologySuite | Infra: integração espacial. |
| Já incluída | Microsoft.EntityFrameworkCore.Design | API: ferramentas de design/migrations. |
| Já incluída | Microsoft.AspNetCore.OpenApi | API: contrato HTTP em JSON. |
| Etapa de contas | Microsoft.AspNetCore.Identity.EntityFrameworkCore | Infra: persistência de usuários e roles. |
| Etapa de contas | Microsoft.AspNetCore.Authentication.JwtBearer | API: validação de tokens JWT. |
| Etapa de mapas | leaflet | Apps cliente/parceiro: mapa; wrapper React é opcional. |
| Etapa de tempo real | @microsoft/signalr | Apps: cliente JavaScript do Hub. |
| Etapa de jobs | Quartz.Extensions.Hosting | Backend: agendamento integrado ao host. |

No servidor ASP.NET Core, SignalR já faz parte do framework compartilhado. Não instale por hábito pacotes antigos Microsoft.AspNetCore.SignalR. Para mapas, a biblioteca Leaflet não fornece sozinha cálculo de rotas, trânsito e geocodificação. Para Quartz persistente, será necessário configurar armazenamento e tabelas; instalar o pacote sozinho não torna o agendamento durável.

Também evite adicionar Axios, Redux, vários validadores e vários componentes de mapa simultaneamente sem uma necessidade. fetch e Query resolvem o primeiro fluxo. Uma dependência acrescenta código, atualização e manutenção ao projeto.

## 20. Transformar os prints em um padrão de interface

Os prints mostram seis padrões úteis: mapa ocupando a maior parte da tela, cartão de oferta com valor destacado, barra de navegação inferior, página de veículos, carteira com histórico e etapa de verificação. Eles são referência de composição. A paleta do SOS Trânsito segue sua escolha de branco, preto e cores semânticas; as áreas azuis/roxas dos exemplos não foram adotadas como identidade do produto.

| Elemento observado | Aplicação no SOS Trânsito | Componente sugerido |
| --- | --- | --- |
| Oferta com preço grande e distância | Mostrar serviço, chegada, líquido e prazo de aceite | OfferCard |
| Mapa grande e comandos sobrepostos | Acompanhar deslocamento e disponibilidade | MapView + MapControls |
| Painel que sobe pela parte inferior | Mostrar parceiro e ação sem esconder todo o mapa | BottomSheet, usando Drawer do MUI |
| Navegação inferior | Início, chamados, ganhos e conta do parceiro | BottomNavigation |
| Página de veículo | Foto opcional, modelo, placa e ações claras | VehicleCard |
| Carteira e lista de repasses | Saldo apurado, pendente e histórico separados | BalanceCard + PayoutList |
| Tela de verificação | Mostrar documento pendente e instrução curta | VerificationStep |
| Menu com títulos grandes | Acesso a conta, suporte e configurações | AccountMenu |

| Uso | Cor proposta | Como aplicar |
| --- | --- | --- |
| Superfície principal | #FFFFFF | Cartões e formulários. |
| Fundo secundário | #F5F5F5 | Separar áreas sem poluir a tela. |
| Texto e ação principal | #171717 | Títulos e botão primário com texto branco. |
| Texto secundário | #595959 | Descrições e informação de apoio. |
| Atenção | #F5C400 | Oferta perto de expirar, pendência e atraso; texto preto. |
| Crítico | #B42318 | Falha de pagamento, erro e ação destrutiva; texto branco. |
| Sucesso | #18794E | Confirmação, parceiro online e conclusão; texto branco. |

Amarelo claro não deve ser usado como texto fino sobre branco. Combine cor com palavras e ícones: “Pendente”, “Falhou” e “Concluído”. A pessoa não pode depender apenas de distinguir vermelho e verde. Use foco visível no teclado, rótulos nos campos, mensagens de erro junto ao problema e botões com área confortável para toque, em torno de 44–48 px.

O cliente e o parceiro devem ser desenhados primeiro para celular. No administrador, as mesmas informações podem usar menu lateral, tabelas e filtros no desktop. A base inicial usa uma navegação simples compartilhada; a tela operacional administrativa será especializada na etapa de chamados.

Evite trazer negociação de corridas e preço dinâmico para o primeiro marco só porque aparecem nos prints. No PDF, esses detalhes dependem de decisões de produto e de uma rede de parceiros. Priorize preço claro, identificação, localização e status.

## 21. Plano de telas e rotas

| Aplicação | Rotas futuras | Objetivo |
| --- | --- | --- |
| Cliente | /entrar, /veiculos, /socorro/novo | Identificar motorista, selecionar veículo e abrir pedido. |
| Cliente | /chamados/:id, /historico, /avaliar/:id | Acompanhar um chamado autorizado e avaliar. |
| Parceiro | /cadastro, /documentos, /disponibilidade | Registrar prestador e liberar operação após análise. |
| Parceiro | /ofertas, /atendimento/:id, /ganhos | Aceitar, executar e conferir recebimentos. |
| Admin | /chamados, /parceiros, /precos, /financeiro | Supervisionar operação e cadastros. |

:id é um parâmetro da rota. Em /chamados/123, ele vale 123. Ter o ID de um chamado não significa poder acessá-lo: a API precisa verificar a relação do usuário com o registro.

Em cada feature do front, adote uma organização parecida com features/chamados/pages, components e hooks. Uma página contém a composição da tela; components contém peças daquele assunto; hooks contém comportamento reutilizável. O que for visual e comum aos três apps vai para packages/ui. O que chama endpoints vai para packages/api-client.

No backend, um próximo módulo pode ter Features/Veiculos/VeiculosController.cs e contratos em Sos.Api; Veiculos/Veiculo.cs em Domain; configuração EF em Infra/Persistence. Não coloque SQL e connection strings dentro de um componente React.

## 22. Login, perfis e autorização

Autenticação responde “quem é você?”. Autorização responde “o que você pode fazer neste registro?”. O usuário do PostgreSQL é uma conta técnica da aplicação; ele não é o cliente motorista. O motorista se autentica na API, não diretamente no banco.

Use ASP.NET Core Identity para usuários, proteção de senhas e roles. Modele Cliente, Parceiro e Administrador como roles; um mesmo usuário pode ter mais de uma, como prevê o PDF. Nunca aceite um campo enviado no cadastro público que permita a pessoa se tornar administradora.

JWT normalmente é um token assinado, não um conteúdo secreto criptografado. Não coloque CPF, documentos ou dados bancários no payload. A API deve validar assinatura, emissor, audiência e expiração. Um token emitido para outro sistema não deve ser aceito só por estar bem formado [11].

Identity não entrega automaticamente um servidor OAuth/OIDC completo. Os endpoints prontos de bearer do Identity também não devem ser confundidos automaticamente com JWT padrão. Antes do login real, defina o emissor e o fluxo de tokens, mantendo a proposta Identity + JWT do PDF.

Para o navegador, uma direção é access token curto em memória e refresh token rotativo em cookie HttpOnly, Secure e com SameSite adequado à implantação. Rotação exige revogar o anterior e detectar reutilização. Endpoints que usam cookies precisam de proteção contra CSRF. Um cookie HttpOnly dificulta a leitura direta pelo JavaScript, mas não elimina XSS. Não grave tokens duradouros em localStorage como atalho.

| Regra | Onde verificar |
| --- | --- |
| Cliente acessa apenas seus veículos e chamados | API, usando identidade do token e filtro de propriedade. |
| Parceiro precisa estar aprovado e disponível | API, consultando o cadastro atual. |
| Parceiro só muda o chamado que assumiu | API, pelo vínculo do chamado. |
| Admin aprova cadastros e altera preços | Política de autorização administrativa e auditoria. |
| Valor final e comissão | Cálculo no servidor, sem confiar no total enviado pela tela. |

Exemplo conceitual: [Authorize(Roles = "Cliente")] exige a role, mas ainda não prova que o veículo solicitado pertence àquele cliente. A consulta também precisa filtrar UsuarioId pelo ID obtido da identidade autenticada. Ocultar um botão no React melhora a interface; não cria essa proteção.

No login por código SMS/WhatsApp, use código de uso único, expiração curta, limite de tentativas e de reenvios. Evite respostas que revelem facilmente se um telefone está cadastrado. Administradores devem ter proteção reforçada, como MFA.

## 23. Segurança que acompanha cada módulo

| Risco ou situação | Prática no projeto |
| --- | --- |
| Entrada inválida | Validar DTO no servidor: tamanho, formato, intervalo e regra de negócio. |
| SQL injection | Usar consultas parametrizadas; não concatenar texto recebido em SQL. |
| Alteração indevida de campos | Receber DTO específico; não aceitar a entidade inteira do banco. |
| XSS | Evitar HTML recebido do usuário e uso imprudente de dangerouslySetInnerHTML. |
| CORS | Liberar apenas origens necessárias quando houver acesso entre origens. CORS não substitui login. |
| Segredos vazando | Não commitar .env; não colocar senha ou segredo JWT em variável VITE_*. |
| Arquivo perigoso | Validar tamanho, assinatura do tipo de arquivo, nome e autorização; armazenar privadamente. |
| Excesso de tentativas | Rate limit nos fluxos de login, oferta, upload e recuperação. |
| Falha difícil de investigar | Logs estruturados com correlation ID, sem tokens ou documentos completos. |
| Perda de dados | Backups separados do servidor e teste real de restauração. |

VITE_* é configuração pública incorporada ao bundle do navegador. Pode conter uma URL pública; não pode conter senha de banco, segredo de API privada ou chave de assinatura. Criptografar um segredo no JavaScript e enviar também o mecanismo de descriptografia não o torna seguro.

Uploads de CNH, documento do veículo e foto precisam de acesso controlado. Uma URL pública permanente não é adequada para documentos pessoais. Remova metadados quando necessário, estabeleça retenção e registre acesso administrativo. Guarde no banco a referência do arquivo, não um caminho arbitrário escolhido pelo usuário.

O print de reconhecimento facial inspira uma etapa guiada, mas não torna biometria obrigatória. O PDF prevê revisão manual no MVP. Dados biométricos usados para identificação são sensíveis na LGPD; uma implementação desse tipo exige definição de finalidade, base legal e controles próprios. Um checkbox genérico não resolve todas essas questões. Comece pelo fluxo de análise documental e avalie a necessidade de biometria separadamente [12].

## 24. Modelo de dados e regras do chamado

| Entidade | Por que existe | Regra importante |
| --- | --- | --- |
| Usuario / roles | Identidade e permissões | Papéis podem coexistir. |
| Veiculo | Carro/moto do cliente | Toda consulta pessoal verifica o proprietário. |
| Parceiro | Perfil do prestador | Status: pendente, aprovado ou suspenso. |
| ParceiroServico | Relação de serviços oferecidos | Um prestador pode atender várias categorias. |
| ParceiroPosicao | Localização recente | Separada do cadastro; registrar data da atualização. |
| Chamado | Pedido principal | Dono, origem, serviço, preço e status. |
| ChamadoOferta | Convite enviado ao parceiro | Registrar prazo e resposta. |
| ChamadoEvento | Histórico de acontecimentos | Registrar quem fez o quê e quando. |
| Pagamento | Cobrança e confirmação | Identificador único do gateway e processamento idempotente. |
| Avaliacao | Feedback do serviço | Somente participantes e após a conclusão. |
| TabelaPreco | Regras de cálculo | Versão do preço aplicado precisa ficar registrada. |

Use chaves primárias e estrangeiras para relacionamentos. UUID/Guid é uma opção para identificadores expostos. IDs difíceis de adivinhar não substituem autorização. Para dinheiro, use decimal em C# e numeric no PostgreSQL; evite float/double. Para momentos, use UTC e tipos apropriados, convertendo apenas na apresentação. Nunca aceite status ou preço arbitrário só porque veio de uma tela sua.

O fluxo principal é rascunho, procurando, aceito, a caminho, chegou, em atendimento e concluído. Há saídas para cancelado e expirado em condições específicas. Cada transição deve ter autor permitido e pré-condições: um chamado concluído não volta para procurando por uma requisição comum.

Dois parceiros podem aceitar juntos. O backend precisa fazer um UPDATE condicional e verificar se exatamente uma linha foi alterada. O teste conceitual é “status ainda é procurando e parceiro ainda está livre?”. O vencedor registra a oferta e o evento na mesma transação; o outro recebe conflito amigável. Desabilitar o botão apenas no front não resolve concorrência.

Uma transação agrupa alterações que devem confirmar juntas. Idempotência evita repetir um efeito quando a mesma operação é reenviada, como após perda de rede. Ao evoluir para entrega confiável de eventos, uma outbox pode registrar a mensagem na mesma transação do chamado e enviá-la depois.

## 25. Geolocalização, mapa e PostGIS

Geolocalização do navegador obtém coordenadas com permissão do usuário. Latitude mede norte/sul; longitude mede leste/oeste. Em NetTopologySuite, Point usa X = longitude e Y = latitude. Portanto: new Point(longitude, latitude) { SRID = 4326 }. Em várias APIs de mapa, a ordem é latitude/longitude: confira cada chamada.

SRID identifica o sistema de referência. Com geography(Point,4326), operações como ST_DWithin recebem distância em metros. geometry com SRID 4326 usa unidades angulares em operações planas; não trate graus como metros. Não calcule quilômetros chamando Distance em objetos NTS em memória sem avaliar a projeção. Faça a consulta espacial apropriada no banco [13–14].

Um índice GiST ajuda consultas espaciais como o filtro por proximidade, mas não torna qualquer ORDER BY ST_Distance automaticamente uma busca indexada eficiente. Analise o plano e a quantidade de candidatos. Depois do filtro geográfico, distância por rota pode ser necessária: duas pessoas próximas em linha reta podem estar em lados diferentes de uma rodovia.

Antes de enviar uma oferta, filtre parceiro aprovado, online, compatível com o serviço, sem atendimento conflitante e com posição recente. Registre quando cada posição foi atualizada; um celular sem sinal não deve continuar parecendo disponível indefinidamente.

Leaflet exibe o mapa. OpenStreetMap fornece dados geográficos. Os servidores públicos de tiles têm regras, capacidade limitada e não fornecem SLA de operação comercial. Mantenha atribuição e escolha um provedor apropriado ao volume; não considere a infraestrutura de mapas “ilimitada e gratuita”. Não baixe tiles em massa para cache offline [15].

## 26. SignalR e trabalhos em segundo plano

HTTP resolve ações como consultar catálogo e criar chamado. SignalR entrega avisos do servidor à tela sem a necessidade de atualizar a página. Ele pode usar WebSockets e outros transportes; não substitui persistência, transações ou autorização.

O SocorroHub futuro terá eventos como OfertaRecebida, ChamadoAceito, PosicaoParceiro, StatusAtualizado e MensagemChat. O servidor só pode colocar alguém em chamado:{id} depois de conferir se é cliente, parceiro aceito ou administrador autorizado. Receber um ID informado pelo navegador e entrar no grupo sem validar permitiria acompanhar chamados alheios [16].

Após reconectar, a tela consulta o estado atual pela API e restabelece as inscrições autorizadas. Não presuma que todos os eventos ocorridos durante a queda serão reenviados. Remova handlers ao desmontar componentes e trate o primeiro connect e as reconexões. A posição precisa parar de ser compartilhada ao terminar a autorização do atendimento.

O navegador móvel pode suspender páginas em segundo plano. Um PWA não garante rastreamento contínuo igual a um aplicativo nativo. Teste perda de sinal, tela bloqueada e economia de bateria antes de prometer operação contínua.

Quartz.NET será usado para prazos de oferta e expiração. O prazo final deve ser guardado no banco; um setTimeout no navegador não é autoridade para o negócio. Para sobreviver a reinícios, configure persistência do scheduler e jobs idempotentes. Comece com uma instância da API. Redis/backplane só entra quando a topologia e o volume exigirem mais instâncias.

## 27. Pagamentos e PWA

Escolha um gateway somente após comparar contrato, recursos e integração necessários. Use ambiente de testes. O frontend não deve armazenar número completo de cartão ou CVV. Prefira tokenização/checkout do provedor. A API calcula o total, registra a intenção e trata a confirmação verificável do gateway.

O retorno da página “pagamento aprovado” não é prova suficiente de liquidação. Valide a assinatura/autenticidade do webhook e processe seu identificador uma vez. Registre valores, taxas, ajustes, devoluções e repasses separadamente para reconciliar. Clique duplicado, webhook repetido e tentativa de cobrança após perda de rede precisam ser tratados.

O PDF sugere Pix/cartão e repasse semanal no início. Os percentuais do documento são propostas, não regras já decididas. A tela de ganhos precisa distinguir saldo previsto, confirmado, disponível e transferido. Não use um número somado na interface como livro financeiro.

O kit configura PWA para cliente e parceiro no build. O manifest descreve nome, ícones e modo de abertura; o service worker pode servir a estrutura estática. Em desenvolvimento, o worker está desabilitado para não esconder mudanças atrás de cache [17].

A política inicial usa rede para /api e exclui API/Hub do fallback de navegação. Isso evita transformar uma consulta indisponível em uma falsa resposta de aplicativo. Não cache documentos pessoais, tokens, chat privado ou pagamentos como se fossem imagens estáticas. Limpe dados específicos de conta no logout quando esse módulo existir.

Sem internet, a interface pode explicar a indisponibilidade, mas não deve dizer que um SOS foi confirmado sem confirmação do servidor. A base inicial também não implementa fila offline de pedidos. Antes de adicionar essa fila, defina idempotência, prazo e confirmação visível.

## 28. Ordem de desenvolvimento, com critérios de conclusão

| Etapa | O que construir | Só avance quando |
| --- | --- | --- |
| 1. Base, incluída | Monorepo, tema, banco, API e catálogo | Cinco serviços aparecem vindos do PostgreSQL. |
| 2. Identidade | Contas, código/senha, roles e autorização | Um usuário não consegue se tornar admin nem acessar dados de outro. |
| 3. Veículos | Cadastro, validação e propriedade | Cliente cria e consulta somente seus veículos. |
| 4. Parceiros | Documentos, serviços e aprovação | Prestador pendente não recebe/aceita atendimento. |
| 5. Chamado | Origem, serviço, preço, status e cancelamento | Regras e histórico são consistentes mesmo com repetição da requisição. |
| 6. Matching | PostGIS, posições recentes, ofertas e aceite | Dois aceites simultâneos produzem só um vencedor. |
| 7. Tempo real | Hub, mapa, chat e adicionais | Reconexão recupera estado sem expor outro chamado. |
| 8. Pagamento | Sandbox, webhook, extrato e repasse | Webhook repetido não duplica cobrança ou saldo. |
| 9. Operação | Logs, backup, restauração e homologação | Equipe recupera dados e investiga um erro de ponta a ponta. |
| 10. Piloto | Região pequena e parceiros reais | Fluxo completo é validado em celulares e rede instável. |

Para as primeiras sessões: na primeira, instale e confira versões; na segunda, execute banco/API/catálogo; na terceira, altere um componente e acompanhe a consulta; na quarta, estude migrations e o modelo; depois comece identidade. Isso é uma ordem de estudo, não uma promessa de prazo.

Defina uma tarefa pequena por vez: “listar serviços” é verificável; “fazer todo o backend” é amplo demais. Anote o resultado esperado antes de codar. Separe ideias futuras do trabalho necessário para o próximo fluxo funcionar.

## 29. Git, trabalho em equipe e publicação

Na raiz do kit, depois de revisar os arquivos:

```powershell
git init
git status
git check-ignore .env
git add .
git diff --cached --stat
git commit -m "Inicia estrutura do SOS Transito"
```

git status mostra mudanças; git check-ignore confirma que .env é ignorado; add prepara arquivos; diff --cached --stat resume o que entrará no commit; commit registra um ponto de histórico. Antes de compartilhar, examine também o diff completo e confirme que nenhuma credencial entrou. .gitignore não remove um segredo já commitado: nesse caso é necessário tratar o histórico e trocar a credencial.

Para uma tarefa: git switch -c feat/cadastro-veiculo cria uma branch. Trabalhe, revise, compile e envie uma alteração pequena para revisão. O lockfile é compartilhado. Mudanças no tema devem ser verificadas nos três fronts.

Para um grupo de cinco, uma divisão inicial possível é: cliente; parceiro; administrador e componentes compartilhados; API/identidade/chamados; banco/integrações/validação. Todos precisam entender o fluxo completo. Registrem juntos os contratos HTTP e as decisões, evitando que front e back inventem nomes diferentes para o mesmo campo.

Homologação e produção precisam de bancos, segredos e configurações separados. Na VPS, a API poderá rodar em container atrás de Nginx com HTTPS. O banco fica em rede privada. Publique os dist dos três apps com fallback para index.html em rotas de interface e encaminhe /api e /hubs corretamente. Não publique o servidor npm run dev como servidor de produção.

A etapa de deploy deve compilar, testar, gerar artefatos, revisar migrations e aplicar a mudança de banco de forma controlada. Logs, healthchecks, restauração de backup e monitoramento precisam estar funcionando antes de um piloto real. O compose do kit sobe somente o banco local para facilitar o aprendizado e o debug da API.

## 30. Problemas comuns e como investigar

| Sintoma | Verificação inicial | Correção provável |
| --- | --- | --- |
| npm não reconhecido | node --version e novo terminal | Instalar Node 24 e reabrir o terminal. |
| npm.ps1 bloqueado | Política do PowerShell | Executar npm.cmd para os comandos npm. |
| Docker não conecta | Docker Desktop e docker info | Iniciar motor, conferir WSL/virtualização. |
| Porta já usada | Mensagem com 5080/5173/55432 | Encerrar processo conhecido ou alterar configuração de forma consistente. |
| Banco recusa senha | Conferir .env e volume existente | Não presumir que editar .env altera usuário já criado. |
| CREATE USER dá erro SQLite | Tipo da conexão no DBeaver | Abrir conexão PostgreSQL correta. |
| API diz segredo ausente | Configurar-local e launch-profile | Gerar User Secrets e executar perfil http. |
| relation servicos does not exist | Migrations e base selecionada | Aplicar migrar.ps1 no banco de desenvolvimento. |
| permission denied for table | Usuário e grants | Conferir criação de sos_app e privilégios do proprietário. |
| Front falha com 500/502 | Network e terminal da API | Verificar API, proxy, conexão e migration. |
| Funciona em localhost e não no celular | Endereço de loopback | Planejar acesso de rede e HTTPS em uma etapa própria. |
| Refresh numa rota publicada retorna 404 | Configuração de hospedagem | Ajustar fallback das rotas do front; preservar /api. |
| Build falha sem erro útil neste ambiente | Log detalhado e paralelismo | Tentar dotnet build backend/Sos.slnx -m:1. |

Para investigar: reproduza, anote a ação, veja o status HTTP, leia o log correspondente e verifique a consulta/banco quando necessário. Não exponha todas as portas ou desative autorização para “testar se funciona”.

No caso do kit, um teste simples é parar a API e verificar se o front apresenta erro; reiniciar a API e clicar em tentar novamente deve recuperar o catálogo. Isso valida comportamento útil, não apenas aparência.

## 31. Vocabulário técnico para consulta

| Termo | Explicação simples | Exemplo no projeto |
| --- | --- | --- |
| Stack | Conjunto de tecnologias | React + .NET + PostgreSQL. |
| Linguagem | Forma de escrever instruções | JavaScript e C#. |
| Biblioteca | Código reutilizável que você chama | React, Leaflet. |
| Framework | Estrutura que organiza e executa seu código | ASP.NET Core. |
| Dependência | Pacote de que seu código precisa | Npgsql. |
| SDK | Ferramentas para desenvolver/compilar | .NET SDK. |
| Runtime | Ambiente para executar código | .NET Runtime, Node.js. |
| CLI | Ferramenta usada por comandos | dotnet, npm, git. |
| Terminal/shell | Lugar/programa que interpreta comandos | PowerShell. |
| PATH | Locais onde o terminal procura executáveis | Encontrar dotnet ao digitar seu nome. |
| Front-end | Parte apresentada no navegador | Aplicativo do cliente. |
| Backend | Regras executadas no servidor | API de chamados. |
| API | Contrato de comunicação entre programas | Consulta de serviços. |
| Endpoint | Endereço e método de uma operação | GET /api/servicos. |
| Rota | Caminho associado a uma ação/tela | /veiculos. |
| HTTP | Protocolo de requisição/resposta | GET e POST. |
| HTTPS | HTTP protegido por TLS | Publicação com certificado. |
| JSON | Formato textual de dados | Lista de serviços. |
| Status HTTP | Código de resultado | 200 OK, 401 sem autenticação, 403 proibido. |
| Componente | Peça reutilizável da interface | ServiceCard. |
| Props | Dados recebidos por um componente | nome, descricao. |
| Estado | Valor que influencia a renderização | online/offline no React. |
| Hook | Função integrada ao ciclo do React | useState, useQuery. |
| JSX | Sintaxe de interface dentro de JS | <ServiceCard />. |
| Renderizar | Produzir/atualizar a interface | Mostrar uma lista nova. |
| Evento | Acontecimento tratado pelo código | Clique, resposta recebida. |
| Promise | Resultado futuro de uma operação | Resposta de fetch. |
| async/await | Sintaxe para operações assíncronas | Aguardar consulta sem bloquear a interface. |
| Cache | Reuso temporário de informação | Query guarda catálogo recente. |
| Build | Transformação do código em artefatos | dist e arquivos .NET compilados. |
| HMR | Atualização de módulo durante desenvolvimento | Vite reflete alteração sem reiniciar tudo. |
| SPA | Aplicação com navegação controlada no navegador | React Router. |
| PWA | Aplicação web com recursos de instalação/offline | Manifest e service worker. |
| Manifest | Arquivo descritivo | Nome/ícones do PWA ou ferramentas .NET. |
| Service worker | Script do navegador que pode interceptar rede/cache | Servir interface estática offline. |
| Monorepo | Um repositório para vários projetos | apps, packages e backend juntos. |
| Workspace npm | Pacote local gerenciado pela raiz | @sos/cliente. |
| Pacote | Unidade reutilizável/versionada | @sos/ui. |
| Lockfile | Registro das versões resolvidas | package-lock.json. |
| Monólito modular | Um backend implantável dividido em assuntos | Módulos de parceiros e chamados. |
| Entidade | Representação de um conceito com identidade | Servico, Chamado. |
| DTO | Objeto de entrada/saída de uma operação | ServicoResponse. |
| ORM | Mapeamento entre objetos e banco relacional | EF Core. |
| Provider/driver | Ponte para um banco específico | Npgsql. |
| DbContext | Sessão de acesso/persistência do EF | SosDbContext. |
| DbSet | Acesso a entidades de um tipo | db.Servicos. |
| LINQ | Sintaxe/APIs de consulta do C# | Where, Select e OrderBy. |
| Migration | Mudança de estrutura versionada | InicialCatalogo. |
| Seed | Dados iniciais controlados | Cinco categorias de socorro. |
| PK/FK | Chave primária/estrangeira | Veiculo.UsuarioId aponta para Usuario. |
| Índice | Estrutura que acelera certos acessos | Nome único, GiST de posição. |
| Transação | Alterações que confirmam juntas | Aceite e registro de evento. |
| Concorrência | Operações acontecendo simultaneamente | Dois parceiros aceitando. |
| Idempotência | Repetição sem duplicar o efeito | Mesmo webhook processado uma vez. |
| DI | Injeção de dependências | Controller recebe DbContext. |
| Middleware | Etapa no processamento HTTP | Tratamento de exceção/autenticação. |
| Autenticação | Comprovar identidade | Entrar por código. |
| Autorização | Conferir permissão | Consultar apenas o próprio chamado. |
| Claim/role | Informação de identidade/papel | ID do usuário e role Parceiro. |
| JWT | Token com informações assinadas | Access token para API. |
| Refresh token | Credencial para renovar sessão | Rotação e revogação. |
| CORS | Regra de acesso entre origens no navegador | Liberar domínio específico do front. |
| XSS/CSRF | Execução indevida de script/ação forjada | Sanitização e proteção de endpoints com cookies. |
| Secret | Informação confidencial de configuração | Senha, chave de assinatura. |
| Hash de senha | Transformação de senha para verificação | Armazenamento feito pelo Identity. |
| WebSocket | Canal bidirecional persistente | Transporte possível do SignalR. |
| Hub | Ponto de comunicação SignalR | SocorroHub. |
| Job | Trabalho agendado/em segundo plano | Expirar oferta. |
| Webhook | Aviso HTTP de outro sistema | Confirmação do gateway. |
| Geocodificação | Conversão entre endereço e coordenadas | Procurar uma rua. |
| SRID | Identificador de referência espacial | 4326. |
| GiST | Tipo de índice útil para dados espaciais | Busca de parceiro próximo. |
| Container/imagem | Processo isolado/modelo usado para criá-lo | Banco PostgreSQL no Docker. |
| Volume | Armazenamento persistente do container | Dados do banco. |
| Proxy | Intermediário que encaminha requisições | Vite local e Nginx em produção. |
| Deploy | Publicar uma versão para execução | Homologação. |
| CI/CD | Automação de validação e entrega | Compilar/testar antes de publicar. |
| Log/healthcheck | Registro de eventos/verificação de saúde | Erro do chamado e /health/live. |

## 32. Exercícios e próximos arquivos a criar

1. Execute banco, API e cliente. Confirme cinco serviços no DBeaver, no endpoint e na tela. Explique como a mesma informação percorreu as três partes.
2. Altere o título da página do cliente. Veja a mudança via Vite e localize qual arquivo é responsável.
3. Altere o raio de borda no theme.js. Confira os três apps e explique por que todos foram afetados.
4. Mude a ordenação da consulta de Id para Nome. Verifique que isso não mudou a estrutura do banco.
5. Pare a API, observe o erro da tela e recupere com tentar novamente após reiniciar.
6. Leia a migration InicialCatalogo e identifique criação da tabela, índice e inserção dos cinco registros.
7. Desenhe os campos de Veiculo e sua relação com Usuario. Antes de criar o CRUD, descreva como impedir acesso ao veículo de outra pessoa.
8. Documente uma decisão em docs/decisoes: por que o primeiro backend é único e modular?

O próximo módulo de implementação é identidade, seguido de veículos. Arquivos previstos incluem Domain/Usuarios/Usuario.cs, Infra/Persistence/IdentityConfiguration.cs e Api/Features/Auth. Eles ainda não existem no kit, para não apresentar código sem autenticação real como se já estivesse protegido.

Critério do primeiro marco: você consegue explicar o caminho completo e repetir a instalação em outra máquina com o README, os lockfiles e os segredos locais daquela máquina.

## 33. Fontes e limites do material

O PDF enviado define o produto, os três perfis, as cinco categorias iniciais, a stack e a organização base. Os prints orientam a hierarquia visual, navegação e cartões. Valores de preços, biometria automática, corridas e mapa de calor não se tornam funcionalidades obrigatórias apenas por aparecerem nas referências.

As orientações de arquitetura e a sequência de aprendizado são propostas para este projeto. Recursos descritos como futuros não estão implementados. A base foi preparada para estudo local; publicação, segurança de contas e integrações precisam dos marcos seguintes.

Documentação oficial consultada em 29/10/2026:

1. Microsoft, suporte .NET: https://dotnet.microsoft.com/en-us/platform/support/policy e https://devblogs.microsoft.com/dotnet/dotnet-8-9-end-of-support/
2. PostgreSQL, versões: https://www.postgresql.org/support/versioning/
3. Node.js, linhas LTS: https://nodejs.org/en/about/previous-releases
4. Vite, início e suporte: https://vite.dev/guide/ e https://vite.dev/releases
5. MUI, instalação: https://v7.mui.com/material-ui/getting-started/installation/ ; React Router: https://reactrouter.com/start/declarative/installation
6. TanStack Query: https://tanstack.com/query/latest/docs/framework/react/quick-start
7. Docker Desktop no Windows: https://docs.docker.com/desktop/setup/install/windows-install/
8. Microsoft, User Secrets: https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-10.0
9. Imagem PostGIS: https://github.com/postgis/docker-postgis
10. Microsoft, ferramentas EF: https://learn.microsoft.com/en-us/ef/core/cli/dotnet
11. Microsoft, JWT: https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication?view=aspnetcore-10.0
12. ANPD, biometria e dados sensíveis: https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-abre-tomada-de-subsidios-sobre-tratamento-de-dados-biometricos
13. Npgsql, integração espacial: https://www.npgsql.org/efcore/mapping/nts.html
14. PostGIS, ST_DWithin: https://postgis.net/docs/ST_DWithin.html
15. OpenStreetMap, uso de tiles: https://operations.osmfoundation.org/policies/tiles/
16. Microsoft, segurança SignalR: https://learn.microsoft.com/en-us/aspnet/core/signalr/security?view=aspnetcore-10.0
17. Vite PWA: https://vite-pwa-org.netlify.app/guide/

Para conferir exatamente o que foi executado nesta preparação, leia VALIDACAO.md, incluído no kit. O Markdown deste guia preserva os comandos em texto e pode ser usado para copiar trechos sem depender da quebra visual de linhas do PDF.
