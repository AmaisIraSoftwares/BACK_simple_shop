import { Router, Response } from 'express';
import { query } from '../config/db';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// Todas as rotas de listas e itens são protegidas por JWT
router.use(authMiddleware);

// GET /listas - Listar todas as listas do usuário autenticado (filtro opcional: ?concluida=true|false)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { concluida } = req.query;
    const params: any[] = [req.userId];
    let filtroConcluida = '';

    if (concluida !== undefined) {
      params.push(concluida === 'true');
      filtroConcluida = 'AND l.concluida = $2';
    }

    const resultado = await query(
      `SELECT l.*,
              COUNT(i.id)::INT AS total_itens,
              COUNT(i.id) FILTER (WHERE i.comprado = TRUE)::INT AS itens_comprados,
              COALESCE(SUM(i.quantidade * COALESCE(i.preco_estimado, 0)), 0)::NUMERIC(10,2) AS total_estimado,
              COALESCE(SUM(i.quantidade * COALESCE(i.preco_real_pago, 0)) FILTER (WHERE i.comprado = TRUE), 0)::NUMERIC(10,2) AS total_real_pago
       FROM listas l
       LEFT JOIN itens_lista i ON i.lista_id = l.id
       WHERE l.usuario_id = $1 ${filtroConcluida}
       GROUP BY l.id
       ORDER BY l.criado_em DESC`,
      params
    );

    return res.json(resultado.rows);
  } catch (error) {
    console.error('Erro ao listar listas:', error);
    return res.status(500).json({ erro: 'Erro ao listar listas de compras.' });
  }
});

// GET /listas/:id - Buscar uma lista específica com seus itens
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const listaRes = await query(
      'SELECT * FROM listas WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.userId]
    );

    if (!listaRes.rowCount) {
      return res.status(404).json({ erro: 'Lista não encontrada.' });
    }

    const itensRes = await query(
      `SELECT i.*,
              c.nome AS categoria_nome,
              c.cor_hex AS categoria_cor,
              c.icone AS categoria_icone
       FROM itens_lista i
       LEFT JOIN categorias c ON c.id = i.categoria_id
       WHERE i.lista_id = $1
       ORDER BY i.comprado ASC, i.ordem_exibicao ASC, i.criado_em ASC`,
      [req.params.id]
    );

    return res.json({
      ...listaRes.rows[0],
      itens: itensRes.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar lista:', error);
    return res.status(500).json({ erro: 'Erro ao buscar detalhes da lista.' });
  }
});

// POST /listas - Criar nova lista de compras
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, cor_hex, orcamento_estimado } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
    }

    const resultado = await query(
      `INSERT INTO listas (usuario_id, nome, cor_hex, orcamento_estimado)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.userId, String(nome).trim(), cor_hex ?? '#2196F3', orcamento_estimado ?? null]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao criar lista:', error);
    return res.status(500).json({ erro: 'Erro ao criar lista de compras.' });
  }
});

// PUT /listas/:id - Atualizar lista de compras
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, cor_hex, orcamento_estimado, concluida } = req.body;

    let concluidaEmClause = 'concluida_em';
    if (typeof concluida === 'boolean') {
      concluidaEmClause = concluida ? 'COALESCE(concluida_em, CURRENT_TIMESTAMP)' : 'NULL';
    }

    const resultado = await query(
      `UPDATE listas
       SET nome = COALESCE($1, nome),
           cor_hex = COALESCE($2, cor_hex),
           orcamento_estimado = COALESCE($3, orcamento_estimado),
           concluida = COALESCE($4, concluida),
           concluida_em = ${concluidaEmClause},
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $5 AND usuario_id = $6
       RETURNING *`,
      [
        nome ? String(nome).trim() : null,
        cor_hex ?? null,
        orcamento_estimado ?? null,
        typeof concluida === 'boolean' ? concluida : null,
        req.params.id,
        req.userId,
      ]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Lista não encontrada.' });
    }

    return res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar lista:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar lista.' });
  }
});

// DELETE /listas/:id - Excluir lista de compras
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resultado = await query(
      'DELETE FROM listas WHERE id = $1 AND usuario_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Lista não encontrada.' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir lista:', error);
    return res.status(500).json({ erro: 'Erro ao excluir lista.' });
  }
});

// ==========================================
// CRUD DE ITENS DA LISTA (/listas/:listaId/itens)
// ==========================================

async function verificarPropriedadeLista(listaId: string, usuarioId?: string): Promise<boolean> {
  const res = await query('SELECT id FROM listas WHERE id = $1 AND usuario_id = $2', [listaId, usuarioId]);
  return Boolean(res.rowCount && res.rowCount > 0);
}

// GET /listas/:listaId/itens - Listar itens de uma lista
router.get('/:listaId/itens', async (req: AuthRequest, res: Response) => {
  try {
    const { listaId } = req.params;
    if (!(await verificarPropriedadeLista(listaId, req.userId))) {
      return res.status(404).json({ erro: 'Lista não encontrada.' });
    }

    const resultado = await query(
      `SELECT i.*,
              c.nome AS categoria_nome,
              c.cor_hex AS categoria_cor,
              c.icone AS categoria_icone
       FROM itens_lista i
       LEFT JOIN categorias c ON c.id = i.categoria_id
       WHERE i.lista_id = $1
       ORDER BY i.comprado ASC, i.ordem_exibicao ASC, i.criado_em ASC`,
      [listaId]
    );

    return res.json(resultado.rows);
  } catch (error) {
    console.error('Erro ao listar itens:', error);
    return res.status(500).json({ erro: 'Erro ao listar itens da lista.' });
  }
});

// POST /listas/:listaId/itens - Adicionar item à lista
router.post('/:listaId/itens', async (req: AuthRequest, res: Response) => {
  try {
    const { listaId } = req.params;
    if (!(await verificarPropriedadeLista(listaId, req.userId))) {
      return res.status(404).json({ erro: 'Lista não encontrada.' });
    }

    const {
      produto_catalogo_id,
      categoria_id,
      nome,
      quantidade,
      unidade_medida,
      preco_estimado,
      preco_real_pago,
      comprado,
      ordem_exibicao,
      observacao,
    } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'O campo nome do item é obrigatório.' });
    }

    const resultado = await query(
      `INSERT INTO itens_lista (
        lista_id, produto_catalogo_id, categoria_id, nome,
        quantidade, unidade_medida, preco_estimado, preco_real_pago,
        comprado, ordem_exibicao, observacao
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        listaId,
        produto_catalogo_id ?? null,
        categoria_id ?? null,
        String(nome).trim(),
        quantidade ?? 1,
        unidade_medida ?? 'un',
        preco_estimado ?? null,
        preco_real_pago ?? null,
        comprado ?? false,
        ordem_exibicao ?? 0,
        observacao ?? null,
      ]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    return res.status(500).json({ erro: 'Erro ao adicionar item na lista.' });
  }
});

// PUT /listas/:listaId/itens/:itemId - Atualizar item da lista
router.put('/:listaId/itens/:itemId', async (req: AuthRequest, res: Response) => {
  try {
    const { listaId, itemId } = req.params;
    if (!(await verificarPropriedadeLista(listaId, req.userId))) {
      return res.status(404).json({ erro: 'Lista não encontrada.' });
    }

    const {
      produto_catalogo_id,
      categoria_id,
      nome,
      quantidade,
      unidade_medida,
      preco_estimado,
      preco_real_pago,
      comprado,
      ordem_exibicao,
      observacao,
    } = req.body;

    const resultado = await query(
      `UPDATE itens_lista
       SET produto_catalogo_id = COALESCE($1, produto_catalogo_id),
           categoria_id = COALESCE($2, categoria_id),
           nome = COALESCE($3, nome),
           quantidade = COALESCE($4, quantidade),
           unidade_medida = COALESCE($5, unidade_medida),
           preco_estimado = COALESCE($6, preco_estimado),
           preco_real_pago = COALESCE($7, preco_real_pago),
           comprado = COALESCE($8, comprado),
           ordem_exibicao = COALESCE($9, ordem_exibicao),
           observacao = COALESCE($10, observacao),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $11 AND lista_id = $12
       RETURNING *`,
      [
        produto_catalogo_id ?? null,
        categoria_id ?? null,
        nome ? String(nome).trim() : null,
        quantidade ?? null,
        unidade_medida ?? null,
        preco_estimado ?? null,
        preco_real_pago ?? null,
        typeof comprado === 'boolean' ? comprado : null,
        ordem_exibicao ?? null,
        observacao ?? null,
        itemId,
        listaId,
      ]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Item não encontrado nesta lista.' });
    }

    return res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar item da lista.' });
  }
});

// DELETE /listas/:listaId/itens/:itemId - Remover item da lista
router.delete('/:listaId/itens/:itemId', async (req: AuthRequest, res: Response) => {
  try {
    const { listaId, itemId } = req.params;
    if (!(await verificarPropriedadeLista(listaId, req.userId))) {
      return res.status(404).json({ erro: 'Lista não encontrada.' });
    }

    const resultado = await query(
      'DELETE FROM itens_lista WHERE id = $1 AND lista_id = $2 RETURNING id',
      [itemId, listaId]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Item não encontrado nesta lista.' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    return res.status(500).json({ erro: 'Erro ao excluir item da lista.' });
  }
});

export default router;
