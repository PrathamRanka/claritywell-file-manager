import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateDocumentSchema } from "@/lib/validations";
import { canViewDocument, canEditDocument, canMoveOrDeleteDocument } from "@/lib/permissions";
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import DOMPurify from 'isomorphic-dompurify';
import { env } from "@/lib/env";
import { s3Client } from "@/lib/s3";
import { rateLimit } from "@/lib/rateLimit";

async function getDocumentWithAclAndRequirement(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: { acl: true, requirement: true }
  });
}

function mapSafeDocument(doc: any) {
  return {
    id: doc.id,
    title: doc.title,
    type: doc.type,
    visibility: doc.visibility,
    ownerId: doc.ownerId,
    requirementId: doc.requirementId,
    contentExcerpt: doc.contentExcerpt,
    contentHtml: doc.contentHtml,
    mimeType: doc.mimeType,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const document = await getDocumentWithAclAndRequirement(params.id);
    if (!document || document.deletedAt) {
      return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });
    }

    const memberships = await prisma.departmentMember.findMany({
      where: { userId: session.user.id },
      select: { departmentId: true }
    });
    const userDepartmentIds = memberships.map((m: any) => m.departmentId);

    if (!canViewDocument(session.user.id, document, session.user.role, userDepartmentIds)) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    let signedUrl = null;
    if (document.storagePath) {
      const command = new GetObjectCommand({
        Bucket: env.SUPABASE_S3_BUCKET_NAME,
        Key: document.storagePath,
      });
      signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 15 * 60 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { documentId: params.id, parentCommentId: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ 
      data: { 
        document: mapSafeDocument(document), 
        signedUrl, 
        comments 
      }, 
      error: null 
    });
  } catch (error) {
    console.error('GET Document[id] Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`doc_patch_${ip}`, 10, 60000)) {
      return NextResponse.json({ data: null, error: 'Too Many Requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const document = await getDocumentWithAclAndRequirement(params.id);
    if (!document || document.deletedAt) return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });

    if (!canEditDocument(session.user.id, document, session.user.role)) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateDocumentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });

    const { title, contentHtml, visibility } = parsed.data;

    let updatedContentHtml = undefined;
    let contentExcerpt = undefined;

    if (contentHtml !== undefined) {
      updatedContentHtml = contentHtml ? DOMPurify.sanitize(contentHtml) : null;
      if (updatedContentHtml) {
        // Regex is used strictly for generating a plaintext excerpt limit for preview lists. 
        // Full HTML is sanitized by DOMPurify above.
        contentExcerpt = updatedContentHtml.replace(/<[^>]+>/g, '').substring(0, 250);
      } else {
        contentExcerpt = null;
      }
    }

    const updatedDocument = await prisma.document.update({
      where: { id: params.id },
      data: {
        ...(title && { title }),
        ...(visibility && { visibility }),
        ...(contentHtml !== undefined && { contentHtml: updatedContentHtml, contentExcerpt }),
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'EDIT',
        userId: session.user.id,
        documentId: params.id,
        metadata: { updatedFields: Object.keys(parsed.data) }
      }
    });

    return NextResponse.json({ data: { document: mapSafeDocument(updatedDocument) }, error: null });
  } catch (error) {
    console.error('PATCH Document[id] Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const document = await getDocumentWithAclAndRequirement(params.id);
    if (!document || document.deletedAt) return NextResponse.json({ data: null, error: 'Not Found' }, { status: 404 });

    if (!canMoveOrDeleteDocument(session.user.id, document, session.user.role)) {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.document.update({
      where: { id: params.id },
      data: { deletedAt: new Date() }
    });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        userId: session.user.id,
        documentId: params.id,
      }
    });

    return NextResponse.json({ data: { success: true }, error: null });
  } catch (error) {
    console.error('DELETE Document[id] Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
