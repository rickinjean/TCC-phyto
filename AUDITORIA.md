# Relatório de Auditoria - Phytografia (TCC)

**Data:** 26/08/2026
**Stack:** MERN (MongoDB, Express.js, React 18, Node.js)

---

## 1. Visão Geral

Projeto de TCC com CRUD de plantas, upload de imagens, autenticação JWT com roles (ADM/User), catálogo com busca, dark mode e coleções dinâmicas.

---

## 2. Problemas Críticos

| # | Problema | Localização |
|---|----------|-------------|
| 1 | JWT Secret hardcoded `"secret-key"` | `server/middleware/auth.js:3` |
| 2 | Credenciais MongoDB hardcoded (usuario/senha no código) | `server/db/conn.js:4` |
| 3 | Rotas de coleção dinâmica sem autenticação (qualquer pessoa pode ler/escrever/deletar) | `server/routes/plant.js:231-276` |
| 4 | Registro permite qualquer role via body injection (cadastro como ADM) | `server/routes/user.js:39` |

---

## 3. Problemas Altos

| # | Problema | Localização |
|---|----------|-------------|
| 5 | Rota `/user/add` cria usuário sem senha (impossível fazer login) | `server/routes/user.js:96-111` |
| 6 | CORS aberto para qualquer origem | `server/server.js:8` |
| 7 | Upload sem validação de tipo/tamanho (aceita executáveis) | `server/routes/plant.js:24` |
| 8 | Incompatibilidade `"User"` vs `"Usuario"` no registro | `Register.js:33` / `user.js:40` |
| 9 | Deletar itens do banco sem autenticação | `createplant.js:163-188` |

---

## 4. Código Duplicado

| # | Descrição | Arquivos |
|---|-----------|----------|
| 10 | `createplant.js` (579 linhas) e `Registerplant.js` (539 linhas) são praticamente idênticos — o segundo é arquivo morto | `createplant.js` / `Registerplant.js` |
| 11 | `mapeamentoColecoes` definido 3 vezes com nomes inconsistentes (`"fruit"` vs `"fruits"`) | `createplant.js:6` / `editplant.js:6` / `Registerplant.js:8` |
| 12 | `RenderSelectComBotaoPlus` duplicado em 3 componentes | `createplant.js` / `editplant.js` / `Registerplant.js` |
| 13 | `salvarNovoItem()` e `deletarItem()` 100% duplicados | `createplant.js:126-188` / `editplant.js:146-208` |
| 14 | Objeto `form` inicial (~45 campos) re-declarado 4 vezes | 4 arquivos |
| 15 | `navbar.css` e `footer.css` duplicados em `index.css` com temas diferentes | `navbar.css` / `footer.css` / `index.css` |

---

## 5. URL Hardcoded (11 arquivos)

A constante `REACT_APP_YOUR_HOSTNAME = 'http://localhost:5050'` está duplicada em:

- `Login.js:6`
- `Register.js:6`
- `inicio.js:4`
- `PlantList.js:4`
- `PlantDetails.js:4`
- `createplant.js:4`
- `editplant.js:4`
- `create.js:4`
- `edit.js:4`
- `userList.js:4`
- `Sobre.js:3`
- `Registerplant.js:5`

---

## 6. Problemas no Código

| # | Problema | Localização |
|---|----------|-------------|
| 16 | `useEffect` com `[users.length]` causa re-render infinito potencial | `userList.js:50` |
| 17 | Links quebrados no navbar (`/dashboardplant`, `/favoritos`, `/configuracoes`, `/perfil`) | `navbar.js:119,130-143` |
| 18 | Links quebrados no card "Acesso Rápido" | `inicio.js:78-89` |
| 19 | `parseJwt()` não valida assinatura — qualquer JWT malicioso é aceito no frontend | `App.js:17-26` |
| 20 | Botões de login social (Google/GitHub) são apenas visuais | `Login.js:159-169` |
| 21 | Formulário de contato na página Sobre não envia dados | `Sobre.js:39-43` |
| 22 | "Lembrar de mim" checkbox não faz nada | `Login.js:132-141` |
| 23 | Rota `/update/:id` usa POST em vez de PUT/PATCH | `user.js:114` |
| 24 | Delete retorna status 204 com JSON body (inválido) | `user.js:142-144` |

---

## 7. Dependências

| # | Problema | Detalhes |
|---|----------|----------|
| 25 | `multer` no `client/package.json` (irrelevante no frontend) | `client/package.json:14` |
| 26 | `cloudinary` e `multer-storage-cloudinary` não utilizados | `server/package.json:17,24` |
| 27 | `@fortawesome/*` duplicadas em server e client | `server/package.json` / `client/package.json` |
| 28 | CRA (create-react-app) depreciado pela Facebook | `client/package.json:17` |
| 29 | Pacotes de teste instalados mas zero testes escritos | `client/package.json:9-11,18` |

---

## 8. Ausências

- **Zero testes** escritos
- **Sem variáveis de ambiente** (tudo hardcoded)
- **Sem Docker/compose** para deploy
- **Sem rate limiting** nos endpoints de login/registro

---

## 9. Arquivos Pessoais no Repositório

- `.bash_profile`, `.bashrc`, `.gitconfig`, `.zshrc`, `.profile`
- `.ripgreprc`, `.idea`, `.vscode`
- `.gitmodules` e `.mcp.json` vazios

---

## 10. Configuração HTML

| Arquivo | Problema |
|---------|----------|
| `index.html:2` | `lang="en"` — deveria ser `pt-BR` |
| `index.html:10` | Meta description genérica do CRA |
| `index.html:27` | Title "React App" em vez de "Phytografia" |

---

## Resumo

| Métrica | Valor |
|---------|-------|
| Componentes React | 15 |
| Endpoints server | ~15 |
| Linhas de CSS | ~2.300 |
| Arquivos com código duplicado | 3 pares |
| Hardcodes de URL | 12 arquivos, 45 ocorrências |
| Dependências não utilizadas | 4 |
| Testes | 0 |
| Arquivos mortos | 1 (`Registerplant.js` — 539 linhas) |

---

## Recomendações

### Prioridade 1 — Segurança
1. Mover JWT_SECRET para variável de ambiente (`.env` com `dotenv`)
2. Mover URI do MongoDB para variável de ambiente
3. Adicionar autenticação ADM nas rotas de coleção dinâmica
4. Validar campo `function` no registro (nunca aceitar "ADM")
5. Adicionar validação no multer (tipo MIME e tamanho máximo)
6. Configurar CORS com lista de origens permitidas
7. Adicionar rate limiting com `express-rate-limit`

### Prioridade 2 — Arquitetura
8. Extrair URL base para `REACT_APP_API_URL` (remover 11 hardcodes)
9. Extrair `mapeamentoColecoes` para módulo compartilhado
10. Extrair `RenderSelectComBotaoPlus`, `salvarNovoItem`, `deletarItem` para hook customizado
11. Unificar/remover `Registerplant.js`
12. Remover CSS duplicado (`navbar.css`, `footer.css`)
13. Usar `process.env.PORT` no server

### Prioridade 3 — Código
14. Corrigir `userList.js:50` — usar `[]` como dependência
15. Corrigir role do registro (`"User"` vs `"Usuario"`)
16. Adicionar senha na rota `/user/add` com hash bcrypt
17. Corrigir links quebrados no navbar e na página inicial
18. Remover `multer` do `client/package.json`
19. Remover dependências não utilizadas

### Prioridade 4 — Qualidade
20. Escrever testes de integração para endpoints críticos
21. ~~Atualizar `public/index.html` (title, lang, meta description)~~ ✅
22. Limpar arquivos pessoais da raiz do repositório
23. ~~Adicionar `.env.example`~~ ✅
24. Migrar de CRA para Vite

---

## Correções Aplicadas (26/08/2026)

### Segurança
| # | Correção | Arquivo |
|---|----------|---------|
| 1 | JWT_SECRET movido para variável de ambiente | `server/middleware/auth.js` |
| 2 | URI do MongoDB movida para variável de ambiente | `server/db/conn.js` |
| 3 | Autenticação ADM adicionada nas rotas de coleção dinâmica | `server/routes/plant.js` |
| 4 | Campo `function` fixo como "User" no registro público | `server/routes/user.js` |
| 5 | Validação de tipo MIME e tamanho (5MB) no upload | `server/routes/plant.js` |
| 6 | CORS configurado com origem específica | `server/server.js` |
| 7 | Rate limiting (20 req/15min) em login e registro | `server/server.js` |

### Backend
| # | Correção | Arquivo |
|---|----------|---------|
| 8 | Rota `/user/add` agora gera hash bcrypt da senha | `server/routes/user.js` |
| 9 | Rota `/update/:id` alterada de POST para PUT | `server/routes/user.js` |
| 10 | Resposta 204 com body removida (agora usa 200) | `server/routes/user.js` |

### Frontend
| # | Correção | Arquivos |
|---|----------|----------|
| 11 | URL base extraída para `REACT_APP_API_URL` via `config.js` | 12 arquivos |
| 12 | `mapeamentoColecoes` extraído para módulo compartilhado | `createplant.js`, `editplant.js` |
| 13 | `useEffect` em `userList.js` usa `[]` (sem re-render infinito) | `userList.js` |
| 14 | Links quebrados no navbar corrigidos (`/createplant`, `/plantlist`, `/Sobre`) | `navbar.js` |
| 15 | Links quebrados na página inicial apontam para `/plantlist` | `inicio.js` |
| 16 | Registro não envia mais `function` do body (sempre "User") | `Register.js` |
| 17 | `deletarItem()` agora envia token de autenticação | `createplant.js`, `editplant.js` |
| 18 | `create.js` inclui campo senha e envia no formulário | `create.js` |
| 19 | `edit.js` usa PUT em vez de POST | `edit.js` |

### Limpeza
| # | Correção | Arquivo |
|---|----------|---------|
| 20 | `Registerplant.js` removido (539 linhas mortas) | `client/src/components/` |
| 21 | `multer` removido do `client/package.json` | `client/package.json` |
| 22 | Dependências não utilizadas removidas do server | `server/package.json` |
| 23 | `index.html`: lang="pt-BR", title "Phytografia", meta description | `client/public/index.html` |
| 24 | Arquivos `.env`, `.env.example` criados no server | `server/` |
| 25 | Arquivo `.env` criado no client | `client/` |
| 26 | `express-rate-limit` instalado no server | `server/` |

### Pendente (requer ação manual)
- ~~Limpar arquivos pessoais da raiz do repositório~~ ✅ (Fase 1 — 27/08/2026)
- Remover `node_modules/` commitados do git (se aplicável)
- Escrever testes de integração
- Migrar de CRA para Vite

---

## Fase 1 — Concluída (27/08/2026)

### Segurança / Limpeza do repositório
| # | Correção | Detalhes |
|---|----------|----------|
| A | Arquivos pessoais removidos da raiz | `.bashrc`, `.bash_profile`, `.gitconfig`, `.zshrc`, `.zprofile`, `.profile`, `.ripgreprc`, `.idea/`, `.vscode/`, `.mcp.json`, `.gitmodules` — removidos do controle de versão e do disco. Backup em `%TEMP%\opencode\tcc-phyto-backup`. |
| B | `.gitignore` criado na raiz | Impede o retorno de arquivos pessoais e `.env` ao repositório. |
| C | Correção da role `"Usuario"` → `"User"` | Radios do painel ADM (`create.js`, `edit.js`) passam a enviar `"User"`, alinhado ao backend (`/user/add` e `/user/register`). |

> Observação: usuários previamente cadastrados com `function: "Usuario"` precisam de backfill manual no MongoDB, caso existam.

### Commit
- `125e06e` — `chore: remover arquivos pessoais da raiz; corrigir role Usuario para User em create/edit`
- Push realizado para `origin/main` em 27/08/2026.
