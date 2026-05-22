import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({ log: ['query', 'error', 'warn'] });

async function main() {
  try {
    const data = {
      id: 'test-debug-uuid-999',
      name: 'Test Klien Debug',
      email: 'debug@test.com',
      phone: '081234567899',
      since: new Date('2026-05-05'),
      status: 'Aktif',
      client_type: 'Langsung',
      last_contact: new Date('2026-05-05T03:50:00.000Z'),
    };
    console.log('Mencoba create client dengan data:', JSON.stringify(data, null, 2));
    const result = await (prisma as any).clients.create({ data });
    console.log('SUKSES:', JSON.stringify(result, null, 2));
    // Cleanup
    await (prisma as any).clients.delete({ where: { id: 'test-debug-uuid-999' } });
    console.log('Cleanup selesai.');
  } catch (err: any) {
    console.error('ERROR PRISMA:', err?.message);
    console.error('Error code:', err?.code);
    console.error('Meta:', JSON.stringify(err?.meta, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main();
