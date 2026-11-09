import { Router, Request, Response } from 'express';
import { query } from '../config/db';
import { normalizarTexto } from '../utils/normalize';

const router = Router();

// GET /produtos - Listar produtos do catálogo (filtros: ?busca=, ?gtin=, ?categoria_id=, ?marca_id=)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { busca, gtin, categoria_id, marca_id } = req.query;
    const condicoes: string[] = [];
    const valores: any[] = [];

    if (busca) {
      valores.push(`%${normalizarTexto(String(busca))}%`);
      condicoes.push(`p.nome_normalizado LIKE $${valores.length}`);
    }
    if (gtin) {
      valores.push(String(gtin).trim());
      condicoes.push(`p.gtin_ean = $${valores.length}`);
    }
    if (categoria_id) {
      valores.push(Number(categoria_id));
      condicoes.push(`p.categoria_id = $${valores.length}`);
    }
    if (marca_id) {
      valores.push(String(marca_id));
      condicoes.push(`p.marca_id = $${valores.length}`);
    }

    const whereClause = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';

    const resultado = await query(
      `SELECT p.*,
              c.nome AS categoria_nome,
              m.nome AS marca_nome
       FROM produtos_catalogo p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN marcas_catalogo m ON m.id = p.marca_id
       ${whereClause}
       ORDER BY p.nome ASC`,
      valores
    );

    return res.json(resultado.rows);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return res.status(500).json({ erro: 'Erro ao listar produtos do catálogo.' });
  }
});

// GET /produtos/:id - Buscar produto por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const resultado = await query(
      `SELECT p.*,
              c.nome AS categoria_nome,
              m.nome AS marca_nome
       FROM produtos_catalogo p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       LEFT JOIN marcas_catalogo m ON m.id = p.marca_id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    return res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return res.status(500).json({ erro: 'Erro ao buscar produto.' });
  }
});

// POST /produtos - Criar produto no catálogo
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      categoria_id,
      marca_id,
      gtin_ean,
      nome,
      unidade_padrao,
      quantidade_embalagem,
      preco_medio_referencia,
      imagem_url,
      fonte_origem,
      dados_brutos,
    } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
    }

    const nomeLimpo = String(nome).trim();
    const nomeNormalizado = normalizarTexto(nomeLimpo);

    const resultado = await query(
      `INSERT INTO produtos_catalogo (
        categoria_id, marca_id, gtin_ean, nome, nome_normalizado,
        unidade_padrao, quantidade_embalagem, preco_medio_referencia,
        imagem_url, fonte_origem, dados_brutos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        categoria_id ?? null,
        marca_id ?? null,
        gtin_ean ?? null,
        nomeLimpo,
        nomeNormalizado,
        unidade_padrao ?? 'un',
        quantidade_embalagem ?? null,
        preco_medio_referencia ?? null,
        imagem_url ?? null,
        fonte_origem ?? 'manual',
        dados_brutos ?? null,
      ]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ erro: 'Já existe um produto cadastrado com este código GTIN/EAN.' });
    }
    console.error('Erro ao criar produto:', error);
    return res.status(500).json({ erro: 'Erro ao criar produto no catálogo.' });
  }
});

// PUT /produtos/:id - Atualizar produto no catálogo
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const {
      categoria_id,
      marca_id,
      gtin_ean,
      nome,
      unidade_padrao,
      quantidade_embalagem,
      preco_medio_referencia,
      imagem_url,
      fonte_origem,
      dados_brutos,
    } = req.body;

    const nomeLimpo = nome ? String(nome).trim() : null;
    const nomeNormalizado = nomeLimpo ? normalizarTexto(nomeLimpo) : null;

    const resultado = await query(
      `UPDATE produtos_catalogo
       SET categoria_id = COALESCE($1, categoria_id),
           marca_id = COALESCE($2, marca_id),
           gtin_ean = COALESCE($3, gtin_ean),
           nome = COALESCE($4, nome),
           nome_normalizado = COALESCE($5, nome_normalizado),
           unidade_padrao = COALESCE($6, unidade_padrao),
           quantidade_embalagem = COALESCE($7, quantidade_embalagem),
           preco_medio_referencia = COALESCE($8, preco_medio_referencia),
           imagem_url = COALESCE($9, imagem_url),
           fonte_origem = COALESCE($10, fonte_origem),
           dados_brutos = COALESCE($11, dados_brutos),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        categoria_id ?? null,
        marca_id ?? null,
        gtin_ean ?? null,
        nomeLimpo,
        nomeNormalizado,
        unidade_padrao ?? null,
        quantidade_embalagem ?? null,
        preco_medio_referencia ?? null,
        imagem_url ?? null,
        fonte_origem ?? null,
        dados_brutos ?? null,
        req.params.id,
      ]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    return res.json(resultado.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ erro: 'Já existe um produto cadastrado com este código GTIN/EAN.' });
    }
    console.error('Erro ao atualizar produto:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar produto.' });
  }
});

// DELETE /produtos/:id - Excluir produto do catálogo
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const resultado = await query('DELETE FROM produtos_catalogo WHERE id = $1 RETURNING id', [req.params.id]);
    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return res.status(500).json({ erro: 'Erro ao excluir produto.' });
  }
});

export default router;
