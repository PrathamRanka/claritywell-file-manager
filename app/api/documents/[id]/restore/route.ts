import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      select: { deletedAt: true }
    });

    if (!document) return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });
    if (!document.deletedAt) return NextResponse.json({ data: null, error: 'Document is not deleted' }, { status: 400 });

    const restoredDocument = await prisma.document.update({
      where: { id: params.id },
      data: { deletedAt: null },
      select: { id: true, title: true }
    });

    await prisma.auditLog.create({
      data: {
        action: 'RESTORE',
        userId: session.user.id,
        documentId: params.id,
      }
    });

    return NextResponse.json({ data: { document: restoredDocument }, error: null });
  } catch (error) {
    console.error('RESTORE Document Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
