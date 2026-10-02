import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const isNeon = connectionString?.includes('neon.tech') || connectionString?.includes('sslmode=require');
const pool = new Pool({ 
  connectionString,
  ssl: isNeon ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
