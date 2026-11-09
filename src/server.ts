import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { query } from './config/db';
import { swaggerDocument } from './config/swagger';

import authRoutes from './routes/auth.routes';
import usuariosRoutes from './routes/usuarios.routes';
import categoriasRoutes from './routes/categorias.routes';
import marcasRoutes from './routes/marcas.routes';
import produtosRoutes from './routes/produtos.routes';
import listasRoutes from './routes/listas.routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Painel interativo Swagger UI para testar a API no navegador
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Simple Shop API - Painel de Testes',
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// Rota de Healthcheck
app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return res.status(500).json({ status: 'error', database: 'disconnected', details: String(error) });
  }
});

// Registro de rotas da API
app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/marcas', marcasRoutes);
app.use('/produtos', produtosRoutes);
app.use('/listas', listasRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Simple Shop API rodando na porta ${PORT}`);
});
