const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.packages.findMany({ select: { id: true, name: true, cover_image: true } })
  .then(data => {
    console.log(data);
    prisma.$disconnect();
  });
