import { Router, Request, Response } from 'express';
import { query } from '../config/db';

const router = Router();

// GET /categorias - Listar todas as categorias
router.get('/', async (_req: Request, res: Response) => {
  try {
    const resultado = await query('SELECT * FROM categorias ORDER BY nome ASC');
    return res.json(resultado.rows);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return res.status(500).json({ erro: 'Erro ao listar categorias.' });
  }
});

// GET /categorias/:id - Buscar categoria por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const resultado = await query('SELECT * FROM categorias WHERE id = $1', [req.params.id]);
    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Categoria não encontrada.' });
    }
    return res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return res.status(500).json({ erro: 'Erro ao buscar categoria.' });
  }
});

// POST /categorias - Criar categoria
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nome, icone, cor_hex } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
    }

    const resultado = await query(
      `INSERT INTO categorias (nome, icone, cor_hex)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nome.trim(), icone ?? null, cor_hex ?? null]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ erro: 'Já existe uma categoria com este nome.' });
    }
    console.error('Erro ao criar categoria:', error);
    return res.status(500).json({ erro: 'Erro ao criar categoria.' });
  }
});

// PUT /categorias/:id - Atualizar categoria
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { nome, icone, cor_hex } = req.body;

    const resultado = await query(
      `UPDATE categorias
       SET nome = COALESCE($1, nome),
           icone = COALESCE($2, icone),
           cor_hex = COALESCE($3, cor_hex)
       WHERE id = $4
       RETURNING *`,
      [nome ? nome.trim() : null, icone ?? null, cor_hex ?? null, req.params.id]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Categoria não encontrada.' });
    }

    return res.json(resultado.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ erro: 'Já existe uma categoria com este nome.' });
    }
    console.error('Erro ao atualizar categoria:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar categoria.' });
  }
});

// DELETE /categorias/:id - Excluir categoria
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const resultado = await query('DELETE FROM categorias WHERE id = $1 RETURNING id', [req.params.id]);
    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Categoria não encontrada.' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return res.status(500).json({ erro: 'Erro ao excluir categoria.' });
  }
});

export default router;
