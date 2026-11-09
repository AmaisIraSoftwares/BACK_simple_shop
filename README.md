# Simple Shop - Backend API

Backend containerizado com **Docker**, **PostgreSQL 16** e **Node.js + TypeScript (Express + JWT)**.

## Como subir com Docker

```bash
docker compose up --build -d
```

- **API**: `http://localhost:3000`
- **Healthcheck**: `GET http://localhost:3000/health`
- **PostgreSQL**: `localhost:5432` (inicializado automaticamente com `db/init.sql`)

---

## Principais Rotas da API

### Autenticação (`/auth`)
- `POST /auth/register` — Cria usuário (`{ nome, email, senha }`) e retorna `{ usuario, token }`
- `POST /auth/login` — Autentica (`{ email, senha }`) e retorna `{ usuario, token }`
- `GET /auth/me` — Retorna dados do usuário logado *(Requer Header `Authorization: Bearer <token>`)*

### Usuários (`/usuarios`) *(Protegido por JWT)*
- `GET /usuarios` — Lista usuários
- `GET /usuarios/:id` — Detalhes de um usuário
- `PUT /usuarios/:id` — Atualiza próprio usuário
- `DELETE /usuarios/:id` — Exclui própria conta

### Categorias (`/categorias`)
- `GET /categorias` — Lista categorias
- `GET /categorias/:id` — Busca categoria por ID
- `POST /categorias` — Cria categoria (`{ nome, icone, cor_hex }`)
- `PUT /categorias/:id` — Atualiza categoria
- `DELETE /categorias/:id` — Remove categoria

### Marcas do Catálogo (`/marcas`)
- `GET /marcas` — Lista marcas (suporta `?busca=termo`)
- `GET /marcas/:id` — Busca marca por ID
- `POST /marcas` — Cria marca (`{ nome }`, gera `nome_normalizado` automaticamente)
- `PUT /marcas/:id` — Atualiza marca
- `DELETE /marcas/:id` — Remove marca

### Produtos do Catálogo (`/produtos`)
- `GET /produtos` — Lista produtos (filtros opcionais: `?busca=`, `?gtin=`, `?categoria_id=`, `?marca_id=`)
- `GET /produtos/:id` — Busca produto por ID
- `POST /produtos` — Cria produto no catálogo
- `PUT /produtos/:id` — Atualiza produto
- `DELETE /produtos/:id` — Remove produto

### Listas e Itens (`/listas`) *(Protegido por JWT)*
- `GET /listas` — Lista todas as listas do usuário logado com resumo financeiro (`total_itens`, `itens_comprados`, `total_estimado`, `total_real_pago`)
- `GET /listas/:id` — Retorna a lista e todos os seus `itens`
- `POST /listas` — Cria lista (`{ nome, cor_hex, orcamento_estimado }`)
- `PUT /listas/:id` — Atualiza lista (`{ nome, cor_hex, orcamento_estimado, concluida }`)
- `DELETE /listas/:id` — Remove lista
- `GET /listas/:listaId/itens` — Lista itens da lista
- `POST /listas/:listaId/itens` — Adiciona item na lista
- `PUT /listas/:listaId/itens/:itemId` — Atualiza item (quantidade, preços, `comprado`, etc.)
- `DELETE /listas/:listaId/itens/:itemId` — Remove item da lista
