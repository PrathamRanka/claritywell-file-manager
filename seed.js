require('dotenv').config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found in environment');
  process.exit(1);
}

const { PrismaClient } = require('./prisma/generated');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  try {
    console.log('🌱 Seeding database...');
    
    // Clear existing data
    await prisma.comment.deleteMany().catch(() => null);
    await prisma.folderItem.deleteMany().catch(() => null);
    await prisma.folder.deleteMany().catch(() => null);
    await prisma.documentACL.deleteMany().catch(() => null);
    await prisma.auditLog.deleteMany().catch(() => null);
    await prisma.document.deleteMany().catch(() => null);
    await prisma.requirement.deleteMany().catch(() => null);
    await prisma.departmentMember.deleteMany().catch(() => null);
    await prisma.department.deleteMany().catch(() => null);
    await prisma.user.deleteMany().catch(() => null);
    console.log('✓ Cleared existing data');

    // ===== USERS =====
    const adminPassword = await bcrypt.hash('password123', 10);
    const userPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash: adminPassword,
        role: 'ADMIN',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      }
    });

    const user1 = await prisma.user.create({
      data: {
        email: 'user@example.com',
        name: 'John Developer',
        passwordHash: userPassword,
        role: 'USER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
      }
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'manager@example.com',
        name: 'Jane Manager',
        passwordHash: userPassword,
        role: 'USER',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
      }
    });

    console.log('✓ Users created:', [admin.email, user1.email, user2.email]);

    // ===== DEPARTMENTS =====
    const engDept = await prisma.department.create({
      data: { name: 'Engineering' }
    });

    const marketingDept = await prisma.department.create({
      data: { name: 'Marketing' }
    });

    const salesDept = await prisma.department.create({
      data: { name: 'Sales' }
    });

    console.log('✓ Departments created:', [engDept.name, marketingDept.name, salesDept.name]);

    // ===== DEPARTMENT MEMBERS =====
    await prisma.departmentMember.createMany({
      data: [
        { userId: admin.id, departmentId: engDept.id },
        { userId: user1.id, departmentId: engDept.id },
        { userId: user1.id, departmentId: marketingDept.id },
        { userId: user2.id, departmentId: salesDept.id },
      ]
    });
    console.log('✓ Department members assigned');

    // ===== REQUIREMENTS =====
    const req1 = await prisma.requirement.create({
      data: {
        clientName: 'Tech Client Corp',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        departmentId: engDept.id,
        createdById: admin.id,
      }
    });

    const req2 = await prisma.requirement.create({
      data: {
        clientName: 'Marketing Solutions Inc',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: 'MEDIUM',
        status: 'OPEN',
        departmentId: marketingDept.id,
        createdById: user1.id,
      }
    });

    const req3 = await prisma.requirement.create({
      data: {
        clientName: 'Enterprise Systems Ltd',
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        priority: 'URGENT',
        status: 'OPEN',
        departmentId: engDept.id,
        createdById: user1.id,
      }
    });

    console.log('✓ Requirements created:', [req1.clientName, req2.clientName, req3.clientName]);

    // ===== DOCUMENTS =====
    const doc1 = await prisma.document.create({
      data: {
        title: 'System Architecture Design',
        type: 'WYSIWYG',
        visibility: 'DEPARTMENT',
        ownerId: admin.id,
        requirementId: req1.id,
        contentHtml: '<h1>System Architecture</h1><p>This document outlines the system architecture...</p>',
        contentExcerpt: 'System architecture design for the new platform',
      }
    });

    const doc2 = await prisma.document.create({
      data: {
        title: 'API Documentation',
        type: 'WYSIWYG',
        visibility: 'SHARED',
        ownerId: user1.id,
        requirementId: req1.id,
        contentHtml: '<h1>API Docs</h1><p>Complete API reference...</p>',
        contentExcerpt: 'Complete API reference documentation',
      }
    });

    const doc3 = await prisma.document.create({
      data: {
        title: 'Project Proposal',
        type: 'PDF',
        visibility: 'PRIVATE',
        ownerId: user2.id,
        requirementId: req2.id,
        storagePath: '/documents/proposal-2024.pdf',
        mimeType: 'application/pdf',
      }
    });

    const doc4 = await prisma.document.create({
      data: {
        title: 'Quarterly Report Q1 2024',
        type: 'WYSIWYG',
        visibility: 'DEPARTMENT',
        ownerId: admin.id,
        contentHtml: '<h1>Q1 2024 Report</h1><p>Summary of Q1 activities...</p>',
        contentExcerpt: 'Q1 2024 quarterly business report',
      }
    });

    const doc5 = await prisma.document.create({
      data: {
        title: 'Team Photo',
        type: 'IMAGE',
        visibility: 'SHARED',
        ownerId: user1.id,
        storagePath: '/images/team-photo.jpg',
        mimeType: 'image/jpeg',
        thumbnailPath: '/images/team-photo-thumb.jpg',
      }
    });

    console.log('✓ Documents created:', [doc1.title, doc2.title, doc3.title, doc4.title, doc5.title]);

    // ===== DOCUMENT ACL (Permissions) =====
    await prisma.documentACL.createMany({
      data: [
        { documentId: doc1.id, userId: user1.id, canEdit: true, canComment: true, canView: true, grantedById: admin.id },
        { documentId: doc1.id, userId: user2.id, canEdit: false, canComment: true, canView: true, grantedById: admin.id },
        { documentId: doc2.id, userId: admin.id, canEdit: true, canComment: true, canView: true, grantedById: user1.id },
        { documentId: doc3.id, userId: admin.id, canEdit: false, canComment: false, canView: true, grantedById: user2.id },
      ]
    });
    console.log('✓ Document permissions (ACL) created');

    // ===== FOLDERS =====
    const folder1 = await prisma.folder.create({
      data: {
        name: 'Projects',
        createdById: admin.id,
      }
    });

    const folder2 = await prisma.folder.create({
      data: {
        name: 'Architecture',
        parentId: folder1.id,
        createdById: admin.id,
      }
    });

    const folder3 = await prisma.folder.create({
      data: {
        name: 'Documentation',
        createdById: user1.id,
      }
    });

    const folder4 = await prisma.folder.create({
      data: {
        name: 'Reports',
        parentId: folder1.id,
        createdById: admin.id,
      }
    });

    console.log('✓ Folders created:', [folder1.name, folder3.name]);

    // ===== FOLDER ITEMS (Documents in Folders) =====
    await prisma.folderItem.createMany({
      data: [
        { folderId: folder2.id, documentId: doc1.id, addedById: admin.id },
        { folderId: folder2.id, documentId: doc2.id, addedById: admin.id },
        { folderId: folder3.id, documentId: doc2.id, addedById: user1.id },
        { folderId: folder4.id, documentId: doc4.id, addedById: admin.id },
      ]
    });
    console.log('✓ Folder items created');

    // ===== COMMENTS =====
    const comment1 = await prisma.comment.create({
      data: {
        documentId: doc1.id,
        authorId: user1.id,
        content: 'Great architecture design! I have a few suggestions on the database layer.',
      }
    });

    const comment2 = await prisma.comment.create({
      data: {
        documentId: doc1.id,
        authorId: admin.id,
        content: 'Thanks for the feedback! Can you share the details?',
        parentCommentId: comment1.id,
      }
    });

    const comment3 = await prisma.comment.create({
      data: {
        documentId: doc2.id,
        authorId: user2.id,
        content: 'API looks comprehensive. Any rate limiting implemented?',
      }
    });

    const comment4 = await prisma.comment.create({
      data: {
        documentId: doc4.id,
        authorId: user1.id,
        content: 'Impressive Q1 numbers! Marketing campaign was very effective.',
      }
    });

    console.log('✓ Comments created');

    // ===== AUDIT LOGS =====
    await prisma.auditLog.createMany({
      data: [
        { action: 'LOGIN', userId: admin.id },
        { action: 'CREATE', userId: admin.id, documentId: doc1.id },
        { action: 'EDIT', userId: user1.id, documentId: doc1.id },
        { action: 'COMMENT', userId: user1.id, documentId: doc1.id },
        { action: 'SHARE', userId: admin.id, documentId: doc2.id },
        { action: 'UPLOAD', userId: user2.id, documentId: doc3.id },
        { action: 'CREATE', userId: admin.id, folderId: folder1.id },
      ]
    });
    console.log('✓ Audit logs created');

    // ===== SUMMARY =====
    const allUsers = await prisma.user.findMany();
    const allDepts = await prisma.department.findMany();
    const allDocs = await prisma.document.findMany();
    const allReqs = await prisma.requirement.findMany();

    console.log('\n✅ Seed complete!');
    console.log(`   📊 Users: ${allUsers.length}`);
    console.log(`   🏢 Departments: ${allDepts.length}`);
    console.log(`   📄 Documents: ${allDocs.length}`);
    console.log(`   ✅ Requirements: ${allReqs.length}`);
    console.log(`   📁 Folders: 4`);
    console.log(`   💬 Comments: 4`);
    console.log('\n📝 Test Credentials:');
    console.log('   Admin: admin@example.com / password123');
    console.log('   User: user@example.com / password123');
    console.log('   Manager: manager@example.com / password123');

  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
