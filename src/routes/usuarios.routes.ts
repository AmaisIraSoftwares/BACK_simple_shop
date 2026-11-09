import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

const router = Router();

// Protege rotas de usuários com JWT
router.use(authMiddleware);

// GET /usuarios - Listar usuários
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const resultado = await query(
      'SELECT id, nome, email, criado_em, atualizado_em FROM usuarios ORDER BY criado_em DESC'
    );
    return res.json(resultado.rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ erro: 'Erro ao listar usuários.' });
  }
});

// GET /usuarios/:id - Buscar usuário por ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resultado = await query(
      'SELECT id, nome, email, criado_em, atualizado_em FROM usuarios WHERE id = $1',
      [req.params.id]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ erro: 'Erro ao buscar usuário.' });
  }
});

// PUT /usuarios/:id - Atualizar usuário
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, email, senha } = req.body;

    if (req.userId !== id) {
      return res.status(403).json({ erro: 'Você só pode atualizar seu próprio perfil.' });
    }

    let senhaHash: string | undefined;
    if (senha) {
      senhaHash = await bcrypt.hash(String(senha), 10);
    }

    const resultado = await query(
      `UPDATE usuarios
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           senha_hash = COALESCE($3, senha_hash),
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, nome, email, criado_em, atualizado_em`,
      [nome ?? null, email ? String(email).toLowerCase().trim() : null, senhaHash ?? null, id]
    );

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ erro: 'Erro ao atualizar usuário.' });
  }
});

// DELETE /usuarios/:id - Remover usuário
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (req.userId !== id) {
      return res.status(403).json({ erro: 'Você só pode excluir sua própria conta.' });
    }

    const resultado = await query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);

    if (!resultado.rowCount) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    return res.status(500).json({ erro: 'Erro ao remover usuário.' });
  }
});

export default router;
