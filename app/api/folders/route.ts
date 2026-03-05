import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDocumentsWhereClause } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const userRole = session.user.role || 'USER';

    // Get user departments
    const memberships = await prisma.departmentMember.findMany({
      where: { userId },
      select: { departmentId: true }
    });
    const userDepartmentIds = memberships.map((m: any) => m.departmentId);

    // Fetch all folders created by user or admin
    // In a real sidebar, we might show folders that have visible documents.
    // For simplicity, we return all non-deleted folders and counts of visible docs inside.
    
    const docWhere = getVisibleDocumentsWhereClause(userId, userRole, userDepartmentIds);

    const folders = await prisma.folder.findMany({
      where: { deletedAt: null },
      include: {
        items: {
          where: {
            document: docWhere
          },
          select: { id: true }
        }
      }
    });

    // Structure folders into a tree (optional, recursive or flat)
    // Requirement said "Include document count per folder"
    const formattedFolders = folders.map(f => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      documentCount: f.items.length
    }));

    return NextResponse.json({ data: { folders: formattedFolders }, error: null });
  } catch (error) {
    console.error('GET Folders Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
