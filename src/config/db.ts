import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/simple_shop',
});

export async function query<T = any>(text: string, params?: any[]) {
  return pool.query<T & Record<string, any>>(text, params);
}
