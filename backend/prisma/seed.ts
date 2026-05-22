import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const userId    = 'a1b2c3d4-e5f6-7890-abcd-ef1234567891';
  const profileId = 'b2c3d4e5-f6a7-8901-bcde-f01234567892';
  const packageId = 'c3d4e5f6-a7b8-9012-cdef-012345678903';

  // 1. Upsert User
  const user = await prisma.users.upsert({
    where: { email: 'admin@dreamywedding.com' },
    update: {},
    create: {
      id: userId,
      email: 'admin@dreamywedding.com',
      password: password,
      full_name: 'Admin Imagenic',
      company_name: 'Imagenic Studio',
      role: 'Admin',
    },
  });
  console.log('✅ User:', user.email);

  // 2. Upsert Profile
  const profile = await prisma.profiles.upsert({
    where: { email: 'admin@dreamywedding.com' },
    update: {},
    create: {
      id: profileId,
      admin_user_id: user.id,
      full_name: 'Admin Imagenic',
      email: 'admin@dreamywedding.com',
      company_name: 'Imagenic Studio',
      phone: '08123456789',
      role: 'Admin',
    },
  });
  console.log('✅ Profile:', profile.full_name);

  // 3. Upsert Package
  const pkg = await prisma.packages.upsert({
    where: { id: packageId },
    update: {},
    create: {
      id: packageId,
      name: 'Premium Wedding Photography',
      price: 5000000.00,
      category: 'Wedding',
      region: 'Jakarta',
      physical_items: JSON.stringify(['1 Album Premium', '2 Frame Foto Ukuran 20R']),
      digital_items: JSON.stringify(['Seluruh Foto Edited (500+)', 'Flashdisk 32GB']),
      processing_time: '14 Hari',
      default_printing_cost: 500000,
      default_transport_cost: 300000,
      photographers: '2',
      videographers: '1',
    },
  });
  console.log('✅ Package:', pkg.name);

  console.log('\n🎉 Seed selesai!');
  console.log('   Login: admin@dreamywedding.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
