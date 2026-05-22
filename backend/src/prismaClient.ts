// Prisma v7 client singleton
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('../generated/prisma/client.js');
const prisma = new PrismaClient();
export default prisma;
