# Phytografia

Aplicação MERN para consulta e gestão de fichas botânicas. O projeto usa React 18, Express, MongoDB, JWT e integrações de login social com Google e GitHub.

## Requisitos

- Node.js 18 ou superior
- MongoDB acessível pela aplicação
- SMTP configurado para permitir novos cadastros com confirmação de e-mail

## Configuração local

1. Instale as dependências:

   ```bash
   cd server && npm ci
   cd ../client && npm ci
   ```

2. Copie `server/.env.example` para `server/.env` e preencha os valores privados. O banco usado pela aplicação chama-se `phytografia`.

3. Configure `JWT_SECRET`, `JWT_REFRESH_SECRET` e `MONGODB_URI`. Para gerar segredos localmente, use `openssl rand -hex 32` duas vezes e informe os resultados em variáveis diferentes.

4. Para habilitar cadastros, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` e `SMTP_PASS`. Contas criadas ficam pendentes até a confirmação do link enviado. Sem SMTP, o endpoint de cadastro responde com erro de configuração e não cria uma conta ativa.

5. Para login social, configure as credenciais de Google e GitHub. Registre estes callbacks nos respectivos provedores:

   - `http://localhost:5050/auth/google/callback`
   - `http://localhost:5050/auth/github/callback`

   `OAUTH_CALLBACK_BASE_URL` define a origem dos callbacks no servidor; `FRONTEND_URL` define para onde o navegador volta após o login.

   Em produção, configure `OAUTH_CALLBACK_BASE_URL` como a origem pública do servidor Express e cadastre os dois caminhos acima nos provedores. Se o frontend e a API forem servidos pela mesma origem, use essa origem nos dois valores.

6. Em desenvolvimento, inicie os serviços em terminais separados:

   ```bash
   cd server && npm run dev
   cd client && npm start
   ```

   Ou use `npm run dev` na raiz `mern-app-main-main` para iniciar ambos.

## Paginação da API

O catálogo e as opções de seleção retornam páginas limitadas. O limite padrão do catálogo é 24; o máximo por resposta é 100. Para opções de coleções, o padrão e o máximo são 100.

```text
GET /plant?page=1&limit=24&search=ipê
GET /collections/type?page=1&limit=100
```

As respostas têm o formato `{ data, pagination }`, com total de registros, página atual, número de páginas e indicadores de navegação. `POST /collections/resolve` resolve apenas os valores referenciados por uma ficha. A rota antiga `/collections/all` foi removida para evitar respostas sem limite.

## Login social

Os fluxos Google e GitHub validam o parâmetro OAuth `state` contra um cookie HttpOnly de curta duração. Após o callback, o servidor redireciona com um código aleatório de uso único, válido por dois minutos. O frontend troca esse código por tokens via `POST /auth/exchange`; access e refresh tokens não são enviados na URL. O login social só aceita endereços de e-mail confirmados pelo provedor.

Se o `REACT_APP_API_URL` do frontend apontar para outra origem, inclua somente a origem da API em `CSP_CONNECT_SRC`, por exemplo `https://api.exemplo.com`. A política CSP não permite curingas.

## Testes

Execute os testes automatizados do servidor com:

```bash
cd server && npm test
```

Os testes usam o runner nativo `node:test` e cobrem limites e metadados da paginação, allowlist da CSP, validação de `state` e consumo único dos códigos OAuth.
