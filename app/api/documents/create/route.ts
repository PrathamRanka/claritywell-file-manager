import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createDocumentSchema } from "@/lib/validations";
import DOMPurify from 'isomorphic-dompurify';
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`doc_create_${ip}`, 10, 60000)) {
      return NextResponse.json({ data: null, error: 'Too Many Requests' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });
    }

    const { title, type, visibility, storagePath, mimeType, contentHtml, requirementId, folderId } = parsed.data;

    let safeContentHtml = contentHtml ? DOMPurify.sanitize(contentHtml) : null;
    let contentExcerpt = null;

    if (safeContentHtml) {
      // Regex is strictly for plaintext excerpt extraction. HTML content is sterilized by DOMPurify.
      contentExcerpt = safeContentHtml.replace(/<[^>]+>/g, '').substring(0, 250);
    }

    // Use Prisma transaction to ensure document creation, folder association, and audit log
    const newDocument = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          title,
          type,
          visibility,
          storagePath,
          mimeType,
          contentHtml: safeContentHtml,
          contentExcerpt,
          ownerId: session.user.id,
          requirementId,
        }
      });

      if (folderId) {
        await tx.folderItem.create({
          data: {
            folderId,
            documentId: doc.id
          }
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'CREATE_DOCUMENT',
          userId: session.user.id,
          documentId: doc.id,
          metadata: { folderId }
        }
      });

      return doc;
    });

    return NextResponse.json({ 
      data: { 
        document: {
          id: newDocument.id,
          title: newDocument.title,
        } 
      }, 
      error: null 
    });
  } catch (error) {
    console.error('CREATE Document Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
