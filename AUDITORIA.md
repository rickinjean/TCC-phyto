# Auditoria atual — Phytografia

**Revisão:** 06/11/2026

**Stack:** React 18, React Router 7, Express 4, MongoDB e Node.js

**Escopo:** inspeção estática, criação de testes unitários/HTTP e execução das suítes de servidor e cliente. Não foi usado MongoDB real, ambiente de produção ou serviço OAuth externo.

## Resumo executivo

O Phytografia é uma aplicação web MERN para consulta de fichas botânicas, organização de plantas em listas pessoais, envio e moderação de sugestões. A auditoria antiga continha pendências já resolvidas e itens desatualizados. Nesta rodada, além de atualizar a cobertura de testes, foram corrigidos dois problemas encontrados anteriormente: a verificação de mesma origem no CORS e a rotação concorrente de refresh tokens.

O cadastro por e-mail continua divergente da documentação: o README descreve confirmação SMTP, mas a rota encontrada cria a conta diretamente. A análise do registro npm também deixou um alerta alto em uma dependência direta não utilizada no código (`nodemailer`).

## Alterações realizadas nesta rodada

### CORS

O callback `origin` do pacote `cors` não recebe `req`; a implementação anterior tentava usá-lo para descobrir a própria origem. A política foi extraída para `server/corsPolicy.js`. Um middleware externo detecta a origem própria com acesso à requisição e deixa chamadas same-origin seguirem sem cabeçalhos CORS; o callback do pacote fica responsável pelas origens explicitamente permitidas e por requisições sem `Origin`.

**Cobertura adicionada:** normalização da origem, allowlist, origem sem header e detecção de mesma origem com `req`.

### Rotação de refresh token

A rota `/auth/refresh` agora consome a sessão com `findOneAndDelete`, condicionada ao hash e à validade, e somente emite uma nova sessão quando o consumo atômico retorna um documento. Isso impede que duas requisições concorrentes usem a mesma sessão original.

**Cobertura adicionada:** teste HTTP concorrente: duas requisições com o mesmo refresh token resultam em uma resposta 200 e uma 401, com somente uma nova sessão criada.

## Testes encontrados e estratégia adotada

Antes desta rodada havia sete testes de unidade: paginação (3), CSP (1) e OAuth (3). Foram preservados e ampliados com testes de unidade e de integração HTTP, executados pelo runner nativo `node:test` no servidor e pelo Jest/CRA no cliente.

| Área | Tipo | Cobertura adicionada ou existente |
|---|---|---|
| Paginação | Unidade | Parsing de parâmetros, metadados e aplicação de skip/limit em cursor simulado. |
| CSP/CORS | Unidade | Allowlist CSP existente; agora também política e normalização de origens CORS. |
| OAuth | Unidade | Aleatoriedade e comparação de `state`, hash, uso único e expiração de código. |
| Autenticação | Unidade | Token ausente, assinatura inválida, claims válidas, autorização por papel e segredo de refresh separado. |
| Dados botânicos | Unidade | Escape de regex, normalização de distribuição, whitelist de campos e validação de países/fontes. |
| Rotas de usuário e mensagens | Integração HTTP | Cadastro, validação de senha, papel fixo `User`, hash bcrypt, validação do contato e proteção administrativa. |
| Sessões | Integração HTTP | Concorrência no refresh token com Express real e MongoDB simulado. |
| Utilitários do cliente | Unidade | Codificação de IDs, normalização textual, distribuição geográfica e busca de países. |

### Resultados observados

- Servidor: `npm test` — **20 testes passaram, 0 falharam**.
- Cliente: `CI=true npm test -- --watchAll=false --runInBand` — **6 testes passaram, 0 falharam**.
- Banco real e integrações externas: não utilizados pelos testes.
- Build de produção: não executado.

### Limites da cobertura

Os testes HTTP montam routers Express com persistência simulada; não são testes contra MongoDB real nem cobrem o servidor completo, proxy, deploy, GridFS, upload, integração de ponta a ponta do OAuth ou todas as rotas de domínio. As unidades também não substituem testes de interface por navegador, avaliação de usabilidade, teste de carga ou teste de segurança. A suíte serve para verificar comportamentos delimitados, não para afirmar ausência geral de defeitos.

## Achados que permanecem

### Alto — cadastro implementado não corresponde ao fluxo documentado

O README instrui configurar SMTP e afirma que o cadastro fica pendente até confirmação por e-mail. A rota `POST /user/register` cria diretamente um usuário com papel `User`; não exige e-mail nem confirmação. `server/.env.example` não contém configuração SMTP. `nodemailer` está declarado como dependência direta, mas não foi localizado no código do servidor.

**Ação sugerida:** definir o fluxo de cadastro desejado e alinhar rota, interface, configuração e README. Se a confirmação for requisito, implementar e testar esse fluxo; se não for, corrigir a documentação e remover a dependência sem uso após confirmar que ela não faz parte de uma funcionalidade planejada.

### Alto — uma dependência de produção tem alerta de segurança

Após `npm audit fix` sem `--force`, a auditoria npm de produção (`npm audit --omit=dev`) encontrou **1 vulnerabilidade alta** em `nodemailer`, dependência direta que não aparece importada pelo código atual. A correção indicada pelo registro npm é `nodemailer@10.3.1`, fora da faixa major declarada no projeto. Antes desta atualização segura, o npm informava 10 vulnerabilidades de produção; o lockfile foi atualizado dentro das faixas compatíveis.

**Ação sugerida:** esclarecer o fluxo SMTP. Se Nodemailer permanecer necessário, revisar a migração major e adicionar testes do envio; se não for usado, removê-lo do manifesto/lockfile. Reexecutar `npm audit --omit=dev` depois da decisão.

### Médio — tokens acessíveis ao JavaScript do navegador

O frontend armazena access token e refresh token em `localStorage` (`client/src/App.js` e `client/src/authFetch.js`). Isso permite restaurar e renovar a sessão, mas qualquer JavaScript executado na origem pode ler os tokens. A autorização de servidor é mantida separadamente; claims decodificadas no frontend não substituem essa validação.

**Ação sugerida:** considerar refresh token em cookie `HttpOnly`, `Secure` e `SameSite` apropriado, com proteção CSRF correspondente, caso o modelo de sessão seja alterado.

### Médio — validação de imagens depende em parte do MIME enviado pelo cliente

O upload limita arquivos a 5 MB, aceita tipos MIME selecionados e processa imagens com Sharp. O MIME é fornecido pelo cliente e não comprova o formato real do conteúdo. Há fallback que grava o original quando o processamento falha.

**Ação sugerida:** validar formato detectado/conteúdo antes de gravar o fallback e definir a resposta para arquivos malformados.

### Baixo — validação de payload de sugestão é parcial

O middleware valida o tipo de sugestão, mas a estrutura completa de `data`, limites de cada campo e demais valores ainda depende de validações parciais da rota.

**Ação sugerida:** formalizar esquemas por tipo, impor limites de tamanho e testar rejeição de payloads inválidos.

### Baixo — listagens administrativas sem paginação

`GET /user` e `GET /messages` carregam todos os documentos. Isso pode aumentar memória, latência e tráfego conforme o crescimento da base. Sugestões já têm limite de resultados.

**Ação sugerida:** aplicar paginação e projeção mínima se a escala de uso exigir.

## Estado técnico confirmado

- Segredos JWT e URI MongoDB exigidos por ambiente; sem fallback de segredo fixo.
- Senhas de cadastro armazenadas com bcrypt e papel público definido no servidor.
- JWT de acesso e refresh com segredos distintos; sessões e códigos OAuth têm hash/expiração.
- Rotas administrativas protegidas por autenticação e papel `ADM`.
- OAuth usa `state` validado e código temporário de uso único.
- CORS por allowlist e exceção same-origin agora separados e cobertos por teste de unidade.
- Upload limitado a 5 MB e no máximo cinco imagens nas rotas de manutenção.
- Coleções dinâmicas usam allowlist; escrita exige papel administrativo.
- Catálogo e opções de coleção oferecem paginação.
- CRA continua sendo usado no frontend; migração para Vite permanece como possibilidade de manutenção.
- O README ainda descreve confirmação de e-mail não localizada na implementação.

## Próximas prioridades

1. Decidir e implementar/documentar o cadastro e o uso de SMTP; resolver a dependência Nodemailer e seu alerta npm.
2. Ampliar a integração HTTP para login, upload, listas, moderação e isolamento de dados entre usuários.
3. Criar testes contra MongoDB temporário ou banco de teste para índices, GridFS, queries e migrações críticas.
4. Avaliar o armazenamento de refresh tokens e validação de conteúdo de imagem.
5. Paginar listagens administrativas e validar payloads de sugestões.
6. Planejar a migração do CRA se houver disponibilidade para tratar o legado da cadeia de build.

## Como reproduzir

```bash
cd mern-app-main-main/server
npm test

cd ../client
CI=true npm test -- --watchAll=false --runInBand
```

Para consultar advisories das dependências de produção do servidor:

```bash
cd mern-app-main-main/server
npm audit --omit=dev
```

O resultado do audit é temporal e pode mudar com novos advisories publicados.
