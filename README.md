# PI-II-TIME-4

![API](https://img.shields.io/badge/API-Node.js%2FExpress-red?style=for-the-badge&logo=node.js&logoColor=white)
![Backend](https://img.shields.io/badge/Backend-TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white)
![Database](https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-HTML%2F%20CSS%2F%20JS-orange?style=for-the-badge&logo=htmx&logoColor=white)
![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow?style=for-the-badge)

## TaskOps

Sistema de acompanhamento de demandas de desenvolvimento de software, permitindo cadastrar, consultar, filtrar, ordenar, atualizar e cancelar tarefas, defeitos, melhorias e atividades de documentação de forma organizada. A aplicação integra frontend em HTML5, CSS3 e JavaScript, backend em Node.js, TypeScript e Express, e banco de dados relacional MySQL, preservando o histórico automático de alterações e comentários sem exclusão física dos registros, com controle de acesso por perfil (`Administrador`, `Lider de projeto` e `Membro da equipe`) e validação de prazos contra feriados nacionais via BrasilAPI.

## Integrantes

> [Guilherme Caitano dos Santos](https://github.com/GC-PUC)\
> [Heizo Alencar da Silva](https://github.com/HeizoSilva)\
> [Jonas Daniel Moreira Paschoalino](https://github.com/JonasPaschoalino456)\
> [Matheus Camargo Ginebro](https://github.com/MatheusCamargoGinebro)\
> [Otávio Cipoletto de Oliveira Andrade](https://github.com/OtavioCipo)

## Pré-requisitos

- **Node.js** (versão LTS vigente — v22+)
- **MySQL** (8.0+)
- **Git**

## Como Implantar e Executar em Ambiente de Testes

### 1. Clonar o repositório

```bash
git clone https://github.com/MatheusCamargoGinebro/PI-II-TIME-N4
cd PI-II-TIME-N4
```

### 2. Criar e popular o banco de dados MySQL

Execute os scripts localizados em `backend/database/` no seu servidor MySQL:

```bash
mysql -u root -p < backend/database/database.sql
mysql -u root -p TaskOps < backend/database/inserts.sql
```

> **Usuários de teste (senha padrão: `PassW0rd@123`):**
>
> - **Administrador:** `carlos@taskops.com`
> - **Líder de Projeto:** `mariana@taskops.com`
> - **Membro da Equipe:** `pedro@taskops.com` (ou demais usuários com perfil `Membro da equipe` em `inserts.sql`)

### 3. Configurar as variáveis de ambiente do Backend

Crie o arquivo `backend/.env` tomando como base o arquivo `backend/.env.example`:

```env
PORT=3000
HOST=localhost
JWT_SECRET=TaskOps_secret_P4ssW0rd
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=sua_senha_mysql
MYSQL_DATABASE=TaskOps
HOLIDAYS_API_URL=https://brasilapi.com.br/api/feriados/v1
```

### 4. Instalar dependências e iniciar o Backend

```bash
cd backend
npm install
npm start
```

A API ficará disponível em `http://localhost:3000` (verifique com `GET /`).

## Principais Endpoints da API

Todas as rotas protegidas exigem o cabeçalho `x-access-token: <JWT>` (ou `Authorization: Bearer <JWT>`).

### Usuários (`/users`)

- `POST /users/login` — Autenticação e geração de token JWT
- `POST /users/register` — Cadastro de novo usuário
- `GET /users/` — Dados do usuário autenticado
- `GET /users/list` — Listagem de todos os usuários (exclusivo `Administrador`)

### Projetos (`/projects`)

- `GET /projects` — Lista projetos visíveis ao perfil (`Administrador` vê todos)
- `POST /projects` — Cria novo projeto (exclusivo `Administrador`)
- `GET /projects/:project_id` — Detalhes e totalizadores do projeto
- `GET /projects/:project_id/tasks` — Lista demandas do projeto (incluindo sem responsável)
- `GET /projects/:project_id/members` — Lista membros vinculados ao projeto
- `POST /projects/:project_id/members` — Vincula um usuário ao projeto (`Administrador` ou `Lider de projeto`)
- `GET /projects/:project_id/members/:user_id` — Detalhes e tarefas de um membro no projeto

### Demandas (`/tasks`)

- `GET /tasks` — Listagem com filtros combinados (`status`, `priority`, `type`, `fk_user_id`, `fk_project_id`), busca textual (`q`) e ordenação (`sort_by`: `priority`, `creation_date`, `due_date`, `status`; `sort_order`: `ASC`/`DESC`)
- `POST /tasks` — Cadastra demanda (status inicial `ABERTA`, responsável opcional, validação de feriado nacional via BrasilAPI)
- `GET /tasks/overview` — Visão geral das demandas relacionadas ao usuário
- `GET /tasks/dashboard` — Métricas do dashboard (total, por status, por prioridade, por tipo, críticas em aberto e próximas do prazo)
- `GET /tasks/:task_id` — Detalhes completos da demanda
- `PUT /tasks/:task_id` e `PATCH /tasks/:task_id` — Edição de demanda com histórico automático e validação de feriados
- `PATCH /tasks/:task_id/status` — Atualização de status respeitando ciclo de vida e RBAC por perfil
- `PATCH /tasks/:task_id/cancel` — Cancelamento lógico (sem exclusão física)
- `GET /tasks/:task_id/comments` e `POST /tasks/:task_id/comments` — Listagem e registro de comentários
- `GET /tasks/:task_id/history` — Histórico automático de alterações da demanda

## Informações Adicionais

> **Curso:** Engenharia de Software – Pontifícia Universidade Católica de Campinas (PUC-Campinas)\
> **Componente Curricular:** Projeto Integrador II\
> **Semestre/Ano:** 1º semestre – 2026\
> **Professor Orientador:** [Fernando Luiz de Almeida Silveira](https://github.com/FernandoPUCC)
