# Phytografia

O Phytografia é uma aplicação web para consultar, organizar e contribuir com informações botânicas. Seu objetivo geral é tornar fichas de plantas fáceis de encontrar e compreender, reunindo identificação, características, cultivo, distribuição geográfica e recursos de organização pessoal em um só lugar. O projeto também permite que usuários autenticados sugiram e mantenham conteúdo, com moderação quando aplicável.

## Tecnologias

- **Frontend:** React 18 e React Router.
- **Backend:** Node.js, Express e MongoDB.
- **Autenticação:** JWT para sessões, confirmação de e-mail no cadastro e login social com Google e GitHub.
- **Mapas e imagens:** mapa de distribuição geográfica e armazenamento/entrega de imagens pelo servidor.

## Requisitos e configuração local

- Node.js 18 ou superior.
- MongoDB acessível pela aplicação.
- SMTP configurado para enviar confirmações de cadastro.

1. Instale as dependências em terminais separados ou a partir da pasta indicada:

   ```bash
   cd server && npm ci
   cd ../client && npm ci
   ```

2. Copie `server/.env.example` para `server/.env` e preencha as configurações privadas. O banco padrão usado pela aplicação chama-se `phytografia`.

3. Configure `MONGODB_URI`, `JWT_SECRET` e `JWT_REFRESH_SECRET`. Use segredos diferentes; por exemplo, gere cada um com `openssl rand -hex 32`.

4. Para permitir novos cadastros, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` e `SMTP_PASS`. As contas ficam pendentes até a confirmação pelo link enviado por e-mail. Sem SMTP, o cadastro retorna erro e não ativa uma conta sem confirmação.

5. Para login social, configure as credenciais Google e GitHub. Cadastre os callbacks abaixo nos provedores:

   - `http://localhost:5050/auth/google/callback`
   - `http://localhost:5050/auth/github/callback`

   `OAUTH_CALLBACK_BASE_URL` define a origem do servidor usada nos callbacks. `FRONTEND_URL` define a origem para a qual o navegador retorna. Em produção, configure os dois valores com as origens públicas correspondentes.

6. Inicie backend e frontend:

   ```bash
   cd server && npm run dev
   cd client && npm start
   ```

   Alternativamente, execute `npm run dev` na raiz `mern-app-main-main` para iniciar os dois serviços.

## Organização do código

### Frontend (`client/src`)

- `App.js`: rotas, estado global de autenticação e troca do código de login social por sessão.
- `components/PlantList.js`, `PlantFilters.js`, `PlantPagination.js` e `PlantCard.js`: catálogo, filtros, paginação e cartões.
- `components/PlantDetails.js`: carrega a ficha e prepara seus dados para exibição.
- `components/PlantDetailsLayout.js`: estrutura visual da ficha, galeria, navegação por seções e painel do carrossel.
- `components/CreatePlant.js`, `EditPlant.js` e `PlantFormWizard.js`: criação e edição de fichas.
- `components/Sugestao.js` e `SugestaoForms.js`: envio e apresentação de sugestões.
- `components/MapaDistribuicao.js` e `distribuicao.js`: visualização e formatação da distribuição.
- `authFetch.js`: chamadas autenticadas à API.
- `index.css`: estilos globais e estilos da ficha de detalhes.

### Backend (`server`)

- `server.js`: inicialização do Express, middleware, CSP, logging e registro de rotas.
- `routes/plant.js`: catálogo, fichas botânicas e opções de coleções.
- `routes/auth.js` e `oauthSecurity.js`: autenticação, confirmação de e-mail e fluxo OAuth.
- `routes/user.js`, `userLists.js` e `suggestions.js`: usuários, listas pessoais e sugestões.
- `pagination.js`: limites e metadados comuns de paginação.
- `csp.js`: validação das origens permitidas para conexões do frontend.
- `db/conn.js`: conexão e índices do MongoDB.
- `test/`: testes do servidor com o runner nativo `node:test`.

## Mudanças recentes e como foram implementadas

### Ficha de detalhes em carrossel

As seções da ficha — cultivo e cuidados, características, distribuição e taxonomia — são selecionadas por abas. O conteúdo desliza horizontalmente, com controles de seção anterior/próxima. Seções sem dados não são incluídas, e a distribuição permanece disponível mesmo quando não há registro. O conteúdo e seus campos foram preservados.

Para alterar essa experiência, ajuste a lista `sections` e os painéis em `PlantDetailsLayout.js`. A quantidade de painéis define a largura do trilho, e o estado `requestedSlide` escolhe a posição. Os estilos de transição, navegação móvel, tema escuro e preferência por movimento reduzido ficam próximos às regras `.plant-detail-carousel-*` em `index.css`. Mantenha os IDs dos painéis alinhados com os IDs das abas e atualize a condição de visibilidade se novos campos forem adicionados.

### Catálogo e opções paginados

As consultas do catálogo e das opções de coleção retornam `{ data, pagination }`, com limites máximos para evitar carregar coleções inteiras em uma única resposta. `server/pagination.js` centraliza o parsing e os metadados; as rotas aplicam `skip`, `limit` e contagem no MongoDB. No frontend, listas e formulários consomem essas respostas paginadas; buscas remotas cancelam pedidos anteriores quando o termo muda.

Ao criar um novo consumidor dessas rotas, leia os itens em `data` e use os metadados de `pagination` para navegação. `POST /collections/resolve` recupera somente as opções referenciadas por uma ficha. A antiga rota `/collections/all` foi removida.

### Cadastro e login social

O cadastro por e-mail depende de confirmação enviada por SMTP. Google e GitHub validam `state` usando cookie HttpOnly e trocam o retorno do provedor por um código temporário de uso único. O frontend envia esse código a `POST /auth/exchange`; access e refresh tokens não trafegam na URL. O código OAuth e o respectivo índice TTL são definidos em `oauthSecurity.js` e `db/conn.js`; alterações no fluxo devem manter uso único, expiração e validação de e-mail confirmado pelo provedor.

### Política de conexões (CSP)

As origens externas que o navegador pode acessar são configuradas por `CSP_CONNECT_SRC`. Informe origens HTTP(S) completas, sem caminhos ou curingas. Se `REACT_APP_API_URL` apontar para outro domínio, inclua a origem da API nessa variável do servidor.

## API: paginação

Exemplos:

```text
GET /plant?page=1&limit=24&search=ipê
GET /collections/type?page=1&limit=100
POST /collections/resolve
```

O catálogo usa 24 itens por padrão e permite até 100 por página. As opções de coleções usam 100 por padrão e como máximo. As respostas paginadas incluem total de itens, página atual, total de páginas e indicadores de navegação.

## Testes e compilação

Execute os testes automatizados do backend:

```bash
cd server && npm test
```

Eles cobrem paginação, allowlist da CSP, validação do `state` e consumo único de códigos OAuth. Para compilar a interface para produção:

```bash
cd client && npm run build
```

## Cuidados ao editar

- Ao alterar o formato de uma rota, atualize todos os consumidores React correspondentes.
- Preserve a confirmação de e-mail e os controles de segurança do OAuth ao mexer na autenticação.
- Ao adicionar campos à ficha, atualize a leitura em `PlantDetails.js`, a visibilidade e o conteúdo dos painéis em `PlantDetailsLayout.js` e, se necessário, o formulário de cadastro/edição.
- Para novos destinos de conexão do navegador, atualize `CSP_CONNECT_SRC` com uma origem específica.
- Nunca inclua segredos reais em `.env.example`, no frontend ou neste README.
