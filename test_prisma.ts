import { PrismaClient } from './backend/prisma/generated/client';
const prisma = new PrismaClient();
// wait, I don't need TS if I can just call the REST endpoint via Node!
