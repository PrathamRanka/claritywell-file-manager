import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const members = await prisma.departmentMember.findMany({
      where: { departmentId: params.id },
      take: limit,
      skip,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });

    return NextResponse.json({ data: { members }, error: null });
  } catch (error) {
    console.error('GET Dept Members Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
