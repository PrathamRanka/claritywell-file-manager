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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          departmentMemberships: {
            include: {
              department: { select: { name: true } }
            }
          }
        }
      }),
      prisma.user.count()
    ]);

    return NextResponse.json({ 
      data: { 
        users, 
        total, 
        page, 
        totalPages: Math.ceil(total / limit) 
      }, 
      error: null 
    });
  } catch (error) {
    console.error('GET Users Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
