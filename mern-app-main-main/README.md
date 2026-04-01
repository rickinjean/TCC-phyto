# MERN App Básico

![my picture](https://github.com/mathlbraga/mern-app-main/blob/main/mern-app.png)

Uma aplicação full-stack [MERN](https://www.mongodb.com/mern-stack) para gerenciamento de informações de usuários.

## Sobre o projeto

Esta é uma aplicação MERN full-stack que gerencia informações básicas de usuários. O app utiliza um banco de dados de usuários hospedado no MongoDB Atlas e exibe os dados utilizando React.

## Tecnologias Utilizadas

**Client:** React, Bootstrap

**Server:** NodeJS, ExpressJS

**Banco de dados:** MongoDB

## Rodando Localmente

Clone o repositório

```bash
  git clone https://github.com/mathlbraga/mern-app-main.git
```

Acesse o diretório do projeto

```bash
  cd mern-app-main
```

Instale as dependências do servidor

```bash
  cd server
  npm install
```
Instale as dependências do cliente

```bash
  cd client
  npm install
```

Configure o parâmetro de conexão com o Atlas em `server/db/conn.js` com sua URI do Atlas:
```
  Db = "mongodb+srv://<username>:<password>@cluster0.xyz123.mongodb.net/?retryWrites=true&w=majority"
```

Altere o nome do banco de dados em`server/db/conn.js` para o seu:

``` 
  _db = client.db("test") 
```
Inicie o servidor

```bash
  cd server
  node server.js
```
Inicie o Cliente

```bash
  cd client
  npm start
```
  

## Funcionalidades do projeto

- O usuário pode **Criar** informações de um usuário e gerenciá-las.

- **Exibição** das informações dos usuários, incluindo nome, nome de usuário, e-mail e função.

- Ações **Alterar** and **Excluir** também estão disponíveis.

## Saiba mais

**FrontEnd**

* Para aprender React, consulte a [React documentation](https://reactjs.org/).

* Veja também a [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

* Comece com o [Bootstrap](https://www.w3schools.com/bootstrap5/index.php), o framework mais popular para construção de sites responsivos e mobile-first.

**BackEnd**

* [Node.js Tutorial](https://www.w3schools.com/nodejs/default.asp)

* [ExpressJS Tutorial](https://www.tutorialspoint.com/expressjs/index.htm)

**Database**

* [MongoDB Tutorial](https://www.w3schools.com/mongodb/)

* Siga o guia [Get Started with MongoDB Atlas](https://www.mongodb.com/docs/atlas/getting-started/) para criar um cluster, conectar-se a ele e carregar seus dados.

**Fullstack**

* Aprenda tudo sobre o [MERN stack](https://www.mongodb.com/languages/mern-stack-tutorial) com este guia passo a passo para desenvolver uma aplicação CRUD simples do zero.

## Aplicação Online

<a href="#">Live fullstack MERN app</a>