import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleDocumentsWhereClause } from "@/lib/permissions";
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from "@/lib/s3";
import { env } from "@/lib/env";

export async function GET(
  req: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { acl: true, requirement: true }
    });

    if (!document || document.deletedAt) return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });
    if (!document.thumbnailPath) return NextResponse.json({ data: null, error: 'No thumbnail found' }, { status: 404 });

    const memberships = await prisma.departmentMember.findMany({
      where: { userId: session.user.id },
      select: { departmentId: true }
    });
    const userDepartmentIds = memberships.map((m: any) => m.departmentId);

    // Permission check for viewing thumbnail (same as doc)
    const docWhere = getVisibleDocumentsWhereClause(session.user.id, session.user.role, userDepartmentIds);
    // Double check if this specific doc is visible
    const isVisible = await prisma.document.count({
      where: {
        id: params.id,
        ...docWhere
      }
    });

    if (isVisible === 0) return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });

    const command = new GetObjectCommand({
      Bucket: env.SUPABASE_S3_BUCKET_NAME,
      Key: document.thumbnailPath,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 5 * 60 }); // Short lived

    return NextResponse.json({ data: { signedUrl }, error: null });
  } catch (error) {
    console.error('GET Thumbnail Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
