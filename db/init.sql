CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_email ON usuarios(email);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(60) NOT NULL UNIQUE, -- 'Hortifrúti', 'Laticínios', 'Limpeza', 'Açougue'
    icone VARCHAR(50),                -- Identificador do ícone no app (ex: 'apple', 'meat')
    cor_hex VARCHAR(7)                -- Ex: '#4CAF50'
);

CREATE TABLE marcas_catalogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    nome_normalizado VARCHAR(100) NOT NULL, -- Minúsculas e sem acento para busca
    criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marcas_busca ON marcas_catalogo(nome_normalizado);

CREATE TABLE produtos_catalogo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    marca_id UUID REFERENCES marcas_catalogo(id) ON DELETE SET NULL,
    gtin_ean VARCHAR(14) UNIQUE,            -- Código de barras (EAN-13 / UPC)
    nome VARCHAR(200) NOT NULL,
    nome_normalizado VARCHAR(200) NOT NULL,
    unidade_padrao VARCHAR(10) DEFAULT 'un',-- 'un', 'kg', 'g', 'l', 'ml'
    quantidade_embalagem NUMERIC(10, 3),    -- Ex: 500 (para pacote de 500g)
    preco_medio_referencia NUMERIC(10, 2),
    imagem_url TEXT,
    fonte_origem VARCHAR(50),               -- 'manual', 'open_food_facts', 'nfe'
    dados_brutos JSONB,                     -- Payload bruto para atributos variáveis
    criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_produtos_catalogo_gtin ON produtos_catalogo(gtin_ean);
CREATE INDEX idx_produtos_catalogo_busca ON produtos_catalogo(nome_normalizado);
CREATE INDEX idx_produtos_catalogo_marca ON produtos_catalogo(marca_id);

CREATE TABLE listas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    cor_hex VARCHAR(7) DEFAULT '#2196F3',
    orcamento_estimado NUMERIC(10, 2),
    concluida BOOLEAN NOT NULL DEFAULT FALSE,
    concluida_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_listas_usuario ON listas(usuario_id);
CREATE INDEX idx_listas_status ON listas(usuario_id, concluida);

CREATE TABLE itens_lista (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lista_id UUID NOT NULL REFERENCES listas(id) ON DELETE CASCADE,
    produto_catalogo_id UUID REFERENCES produtos_catalogo(id) ON DELETE SET NULL,
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    
    nome VARCHAR(200) NOT NULL,
    quantidade NUMERIC(10, 3) NOT NULL DEFAULT 1.000 CHECK (quantidade > 0),
    unidade_medida VARCHAR(10) NOT NULL DEFAULT 'un',
    
    -- Valores para controle financeiro pessoal
    preco_estimado NUMERIC(10, 2) CHECK (preco_estimado >= 0),
    preco_real_pago NUMERIC(10, 2) CHECK (preco_real_pago >= 0),
    
    comprado BOOLEAN NOT NULL DEFAULT FALSE,
    ordem_exibicao INT DEFAULT 0,
    observacao VARCHAR(255),
    
    criado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_itens_lista_lista ON itens_lista(lista_id);
CREATE INDEX idx_itens_lista_produto ON itens_lista(produto_catalogo_id);
