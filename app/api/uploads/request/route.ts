import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { uploadRequestSchema } from "@/lib/validations";
import { s3Client } from "@/lib/s3";
import { env } from "@/lib/env";
import { rateLimit, checkUploadRateLimit } from "@/lib/rateLimit";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkUploadRateLimit(session.user.id)) {
      return NextResponse.json({ data: null, error: "Upload limit exceeded" }, { status: 429 });
    }

    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`upload_request_${ip}`, 10, 60000)) {
      return NextResponse.json({ data: null, error: 'Too Many Requests' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = uploadRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: parsed.error.issues },
        { status: 400 }
      );
    }

    const { fileName, contentType, size } = parsed.data;

    const fileExtension = fileName.split('.').pop();
    const fileKey = `${session.user.id}/${uuidv4()}-${Date.now()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: env.SUPABASE_S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
      ContentLength: size,
    });

    // 15 minutes expiry
    const expiresIn = 15 * 60;
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return NextResponse.json({
      data: {
        uploadUrl,
        fileKey,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      },
      error: null
    });

  } catch (error) {
    console.error('Upload Request Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
