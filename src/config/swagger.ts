export const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Simple Shop API',
    version: '1.0.0',
    description:
      'Painel interativo para testar todas as rotas da API do Simple Shop. Faça login ou registre-se em `/auth/login` ou `/auth/register`, copie o `token` retornado e clique no botão **Authorize** no topo para testar as rotas protegidas.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor Local',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Insira o token JWT gerado no login/registro',
      },
    },
    schemas: {
      CategoriaInput: {
        type: 'object',
        required: ['nome'],
        properties: {
          nome: { type: 'string', example: 'Hortifrúti' },
          icone: { type: 'string', example: 'apple' },
          cor_hex: { type: 'string', example: '#4CAF50' },
        },
      },
      MarcaInput: {
        type: 'object',
        required: ['nome'],
        properties: {
          nome: { type: 'string', example: 'Nestlé' },
        },
      },
      ProdutoInput: {
        type: 'object',
        required: ['nome'],
        properties: {
          categoria_id: { type: 'integer', nullable: true, example: 1 },
          marca_id: { type: 'string', format: 'uuid', nullable: true },
          gtin_ean: { type: 'string', example: '7891000100103' },
          nome: { type: 'string', example: 'Leite Condensado Moça 395g' },
          unidade_padrao: { type: 'string', example: 'un' },
          quantidade_embalagem: { type: 'number', example: 395 },
          preco_medio_referencia: { type: 'number', example: 7.99 },
          imagem_url: { type: 'string', nullable: true },
          fonte_origem: { type: 'string', example: 'manual' },
          dados_brutos: { type: 'object', nullable: true },
        },
      },
      ListaInput: {
        type: 'object',
        required: ['nome'],
        properties: {
          nome: { type: 'string', example: 'Compras do Mês' },
          cor_hex: { type: 'string', example: '#2196F3' },
          orcamento_estimado: { type: 'number', example: 650.0 },
          concluida: { type: 'boolean', example: false },
        },
      },
      ItemListaInput: {
        type: 'object',
        required: ['nome'],
        properties: {
          produto_catalogo_id: { type: 'string', format: 'uuid', nullable: true },
          categoria_id: { type: 'integer', nullable: true, example: 1 },
          nome: { type: 'string', example: 'Maçã Gala' },
          quantidade: { type: 'number', example: 1.5 },
          unidade_medida: { type: 'string', example: 'kg' },
          preco_estimado: { type: 'number', example: 9.9 },
          preco_real_pago: { type: 'number', example: 9.5 },
          comprado: { type: 'boolean', example: false },
          ordem_exibicao: { type: 'integer', example: 1 },
          observacao: { type: 'string', example: 'Escolher as mais maduras' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Verifica status da API e conexão com o PostgreSQL',
        responses: {
          '200': { description: 'API e banco conectados' },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Autenticação'],
        summary: 'Cadastrar novo usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nome', 'email', 'senha'],
                properties: {
                  nome: { type: 'string', example: 'Ariano' },
                  email: { type: 'string', example: 'ariano@exemplo.com' },
                  senha: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Usuário criado + token JWT' },
          '409': { description: 'E-mail já cadastrado' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Autenticar usuário e obter token JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'senha'],
                properties: {
                  email: { type: 'string', example: 'ariano@exemplo.com' },
                  senha: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login realizado com sucesso + token JWT' },
          '401': { description: 'Credenciais inválidas' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Autenticação'],
        summary: 'Obter dados do usuário autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Perfil do usuário logado' },
          '401': { description: 'Não autenticado' },
        },
      },
    },
    '/categorias': {
      get: {
        tags: ['Categorias'],
        summary: 'Listar todas as categorias',
        responses: { '200': { description: 'Lista de categorias' } },
      },
      post: {
        tags: ['Categorias'],
        summary: 'Criar nova categoria',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CategoriaInput' },
            },
          },
        },
        responses: { '201': { description: 'Categoria criada' } },
      },
    },
    '/categorias/{id}': {
      get: {
        tags: ['Categorias'],
        summary: 'Buscar categoria por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Categoria encontrada' }, '404': { description: 'Não encontrada' } },
      },
      put: {
        tags: ['Categorias'],
        summary: 'Atualizar categoria',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CategoriaInput' },
            },
          },
        },
        responses: { '200': { description: 'Categoria atualizada' } },
      },
      delete: {
        tags: ['Categorias'],
        summary: 'Excluir categoria',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '204': { description: 'Categoria excluída' } },
      },
    },
    '/marcas': {
      get: {
        tags: ['Marcas Catálogo'],
        summary: 'Listar marcas (com busca opcional sem acentos)',
        parameters: [
          { name: 'busca', in: 'query', required: false, schema: { type: 'string' }, description: 'Busca por nome' },
        ],
        responses: { '200': { description: 'Lista de marcas' } },
      },
      post: {
        tags: ['Marcas Catálogo'],
        summary: 'Criar marca no catálogo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MarcaInput' },
            },
          },
        },
        responses: { '201': { description: 'Marca criada' } },
      },
    },
    '/marcas/{id}': {
      get: {
        tags: ['Marcas Catálogo'],
        summary: 'Buscar marca por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Marca encontrada' } },
      },
      put: {
        tags: ['Marcas Catálogo'],
        summary: 'Atualizar marca',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/MarcaInput' },
            },
          },
        },
        responses: { '200': { description: 'Marca atualizada' } },
      },
      delete: {
        tags: ['Marcas Catálogo'],
        summary: 'Excluir marca',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Marca excluída' } },
      },
    },
    '/produtos': {
      get: {
        tags: ['Produtos Catálogo'],
        summary: 'Listar produtos do catálogo',
        parameters: [
          { name: 'busca', in: 'query', schema: { type: 'string' } },
          { name: 'gtin', in: 'query', schema: { type: 'string' } },
          { name: 'categoria_id', in: 'query', schema: { type: 'integer' } },
          { name: 'marca_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Lista de produtos' } },
      },
      post: {
        tags: ['Produtos Catálogo'],
        summary: 'Criar produto no catálogo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProdutoInput' },
            },
          },
        },
        responses: { '201': { description: 'Produto criado' } },
      },
    },
    '/produtos/{id}': {
      get: {
        tags: ['Produtos Catálogo'],
        summary: 'Buscar produto por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Produto encontrado' } },
      },
      put: {
        tags: ['Produtos Catálogo'],
        summary: 'Atualizar produto',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ProdutoInput' },
            },
          },
        },
        responses: { '200': { description: 'Produto atualizado' } },
      },
      delete: {
        tags: ['Produtos Catálogo'],
        summary: 'Excluir produto',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Produto excluído' } },
      },
    },
    '/listas': {
      get: {
        tags: ['Listas de Compras'],
        summary: 'Listar listas do usuário autenticado (com totais calculados)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'concluida', in: 'query', schema: { type: 'boolean' }, description: 'Filtrar por status concluída' },
        ],
        responses: { '200': { description: 'Listas do usuário' } },
      },
      post: {
        tags: ['Listas de Compras'],
        summary: 'Criar nova lista de compras',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ListaInput' },
            },
          },
        },
        responses: { '201': { description: 'Lista criada' } },
      },
    },
    '/listas/{id}': {
      get: {
        tags: ['Listas de Compras'],
        summary: 'Buscar lista por ID (inclui todos os itens da lista)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Detalhes da lista + itens' } },
      },
      put: {
        tags: ['Listas de Compras'],
        summary: 'Atualizar lista de compras',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ListaInput' },
            },
          },
        },
        responses: { '200': { description: 'Lista atualizada' } },
      },
      delete: {
        tags: ['Listas de Compras'],
        summary: 'Excluir lista de compras',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Lista excluída' } },
      },
    },
    '/listas/{listaId}/itens': {
      get: {
        tags: ['Itens da Lista'],
        summary: 'Listar itens de uma lista',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'listaId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Itens da lista' } },
      },
      post: {
        tags: ['Itens da Lista'],
        summary: 'Adicionar item à lista',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'listaId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ItemListaInput' },
            },
          },
        },
        responses: { '201': { description: 'Item adicionado' } },
      },
    },
    '/listas/{listaId}/itens/{itemId}': {
      put: {
        tags: ['Itens da Lista'],
        summary: 'Atualizar item da lista (marcar comprado, atualizar preço real, quantidade, etc.)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'listaId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ItemListaInput' },
            },
          },
        },
        responses: { '200': { description: 'Item atualizado' } },
      },
      delete: {
        tags: ['Itens da Lista'],
        summary: 'Remover item da lista',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'listaId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'itemId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '204': { description: 'Item removido' } },
      },
    },
  },
};
