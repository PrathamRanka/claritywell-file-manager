import { withRouteMetrics, timedJson } from '@/lib/utils/route-metrics';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';

async function POSTHandler() {
  try {
    console.log('Starting seed process...');
    console.log('Database URL present:', !!process.env.DATABASE_URL);

    // Check if prisma can connect
    const userCount = await prisma.user.count().catch((e) => {
      console.error('Prisma connection error:', e.message);
      throw e;
    });
    console.log('Current users:', userCount);

    // Delete old users
    const deleted = await prisma.user.deleteMany().catch((e) => {
      console.error('Delete error:', e.message);
      throw e;
    });
    console.log('Deleted users:', deleted.count);

    // Create admin
    const hashedAdminPassword = await bcrypt.hash('password123', 10);
    console.log('Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash: hashedAdminPassword,
        role: 'ADMIN',
      }
    });
    console.log('Admin created:', admin.id);

    // Create test user
    const hashedUserPassword = await bcrypt.hash('password123', 10);
    console.log('Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'Test User',
        passwordHash: hashedUserPassword,
        role: 'USER',
      }
    });
    console.log('Test user created:', testUser.id);

    // Create department
    console.log('Creating department...');
    const department = await prisma.department.create({
      data: {
        name: 'Engineering'
      }
    }).catch((e) => {
      console.error('Department creation error (non-critical):', e.message);
      return null;
    });

    return timedJson({
      message: 'Database seeded successfully',
      users: [admin.email, testUser.email],
      department: department?.name,
      success: true
    });
  } catch (error: any) {
    console.error('Full seed error:', error);
    return timedJson({ 
      error: 'Seed failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export const POST = withRouteMetrics('/api/init/seed', 'POST', POSTHandler);
