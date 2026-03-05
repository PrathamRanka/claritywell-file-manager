const { PrismaClient } = require('./prisma/generated');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient({
    adapter: new (require('@prisma/adapter-pg')).PrismaPg({
      pool: new (require('pg')).Pool({ 
        connectionString: process.env.DATABASE_URL 
      }),
    }),
  });

  try {
    console.log('Seeding database...');
    
    // Delete existing users (for clean slate)
    await prisma.user.deleteMany().catch(() => null);
    console.log('Cleared existing users');

    // Create admin user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: 'ADMIN',
      }
    });
    console.log('✓ Admin user created:', admin.email);

    // Create test user
    const testUserPassword = await bcrypt.hash('password123', 10);
    const testUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Test User',
        passwordHash: testUserPassword,
        role: 'USER',
      }
    });
    console.log('✓ Test user created:', testUser.email);

    // Create test department
    const department = await prisma.department.create({
      data: {
        name: 'Engineering'
      }
    });
    console.log('✓ Department created:', department.name);

    const allUsers = await prisma.user.findMany();
    console.log(`\n✓ Seed complete! Total users: ${allUsers.length}`);
    allUsers.forEach(u => console.log(`  - ${u.email} (${u.role})`));

  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
