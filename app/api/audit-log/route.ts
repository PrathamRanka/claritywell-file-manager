import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const documentId = searchParams.get('documentId');
    const action = searchParams.get('action');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (documentId) where.documentId = documentId;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return NextResponse.json({ 
      data: { 
        logs, 
        total, 
        page, 
        totalPages: Math.ceil(total / limit) 
      }, 
      error: null 
    });
  } catch (error) {
    console.error('GET Audit Log Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
