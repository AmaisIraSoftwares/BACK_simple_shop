import { Router, Request, Response } from 'express';
import { query } from '../config/db';
import { normalizarTexto } from '../utils/normalize';

const router = Router();

// GET /marcas - Listar marcas (suporta filtro ?busca=)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { busca } = req.query;

    if (busca) {
      const termo = `%${normalizarTexto(String(busca))}%`;
      const resultado = await query(
        'SELECT * FROM marcas_catalogo WHERE nome_normalizado LIKE $1 ORDER BY nome ASC',
        [termo]
      );
      return res.json(resultado.rows);
    }

    const resultado = await query('SELECT * FROM marcas_catalogo ORDER BY nome ASC');
    return res.json(resultado.rows);
  } catch (error) {
    console.error('Erro ao listar marcas:', error);
    return res.status(500).json({ erro: 'Erro ao listar marcas.' });
  }
});

// GET /marcas/:id - Buscar marca por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const resultado = await query('SELECT * FROM marcas_catalogo WHERE id = $1', [req.params.id]);
    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Marca não encontrada.' });
    }
    return res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar marca:', error);
    return res.status(500).json({ erro: 'Erro ao buscar marca.' });
  }
});

// POST /marcas - Criar marca
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
    }

    const nomeLimpo = String(nome).trim();
    const nomeNormalizado = normalizarTexto(nomeLimpo);

    const resultado = await query(
      `INSERT INTO marcas_catalogo (nome, nome_normalizado)
       VALUES ($1, $2)
       RETURNING *`,
      [nomeLimpo, nomeNormalizado]
    );

    return res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao criar marca:', error);
    return res.status(500).json({ erro: 'Erro ao criar marca.' });
  }
});

// PUT /marcas/:id - Atualizar marca
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { nome } = req.body;
    if (!nome) {
      return res.status(400).json({ erro: 'O campo nome é obrigatório.' });
    }

    const nomeLimpo = String(nome).trim();
    const nomeNormalizado = normalizarTexto(nomeLimpo);

    const resultado = await query(
      `UPDATE marcas_catalogo
       SET nome = $1,
           nome_normalizado = $2
       WHERE id = $3
       RETURNING *`,
      [nomeLimpo, nomeNormalizado, req.params.id]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Marca não encontrada.' });
    }

    return res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar marca:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar marca.' });
  }
});

// DELETE /marcas/:id - Excluir marca
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const resultado = await query('DELETE FROM marcas_catalogo WHERE id = $1 RETURNING id', [req.params.id]);
    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Marca não encontrada.' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir marca:', error);
    return res.status(500).json({ erro: 'Erro ao excluir marca.' });
  }
});

export default router;
