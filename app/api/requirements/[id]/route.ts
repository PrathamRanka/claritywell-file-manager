import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canViewRequirement } from "@/lib/permissions";

export async function GET(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const userRole = session.user.role || 'USER';

    const requirement = await prisma.requirement.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        createdBy: { select: { name: true } },
        documents: {
          where: { deletedAt: null },
          select: { id: true, title: true, type: true, visibility: true }
        }
      }
    });

    if (!requirement) return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });

    const memberships = await prisma.departmentMember.findMany({
      where: { userId },
      select: { departmentId: true }
    });
    const userDepartmentIds = memberships.map((m: any) => m.departmentId);

    if (!canViewRequirement(userRole, userDepartmentIds, requirement)) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: { requirement }, error: null });
  } catch (error) {
    console.error('GET Requirement[id] Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    // Hard delete or soft? Requirement model has no deletedAt in the schema snippet I saw, but let's check.
    // Looking at schema.prisma line 94... no deletedAt.
    // I will use delete.
    await prisma.requirement.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('DELETE Requirement Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
