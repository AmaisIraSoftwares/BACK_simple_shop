import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db';
import { authMiddleware, AuthRequest, gerarToken } from '../middlewares/auth';

const router = Router();

// POST /auth/register - Cadastrar novo usuário
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha.' });
    }

    const emailFormatado = String(email).toLowerCase().trim();
    const existente = await query('SELECT id FROM usuarios WHERE email = $1', [emailFormatado]);

    if (existente.rowCount && existente.rowCount > 0) {
      return res.status(409).json({ erro: 'Já existe um usuário cadastrado com este e-mail.' });
    }

    const senhaHash = await bcrypt.hash(String(senha), 10);

    const resultado = await query(
      `INSERT INTO usuarios (nome, email, senha_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nome, email, criado_em, atualizado_em`,
      [nome.trim(), emailFormatado, senhaHash]
    );

    const usuario = resultado.rows[0];
    const token = gerarToken(usuario.id);

    return res.status(201).json({ usuario, token });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ erro: 'Erro interno ao registrar usuário.' });
  }
});

// POST /auth/login - Autenticar usuário e gerar JWT
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Informe email e senha.' });
    }

    const emailFormatado = String(email).toLowerCase().trim();
    const resultado = await query(
      'SELECT id, nome, email, senha_hash, criado_em, atualizado_em FROM usuarios WHERE email = $1',
      [emailFormatado]
    );

    if (!resultado.rowCount || resultado.rowCount === 0) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const usuario = resultado.rows[0];
    const senhaValida = await bcrypt.compare(String(senha), usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    const token = gerarToken(usuario.id);
    const { senha_hash, ...usuarioSemSenha } = usuario;

    return res.json({ usuario: usuarioSemSenha, token });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ erro: 'Erro interno ao autenticar usuário.' });
  }
});

// GET /auth/me - Dados do usuário autenticado
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const resultado = await query(
      'SELECT id, nome, email, criado_em, atualizado_em FROM usuarios WHERE id = $1',
      [req.userId]
    );

    if (!resultado.rowCount || resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.json(resultado.rows[0]);
  } catch (error) {
    console.error('Erro em /auth/me:', error);
    return res.status(500).json({ erro: 'Erro interno ao buscar perfil.' });
  }
});

export default router;
