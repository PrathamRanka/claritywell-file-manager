import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request, 
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.departmentMember.delete({
      where: {
        userId_departmentId: {
          userId: params.userId,
          departmentId: params.id,
        }
      }
    });

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('DELETE Dept Member Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
