import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateUserSchema } from '@/lib/validations';
import { updateUserService } from '@/lib/services/userService';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ data: null, error: parsed.error.issues }, { status: 400 });

    const result = await updateUserService({
      userId: params.id,
      role: parsed.data.role,
      name: parsed.data.name,
    });

    return NextResponse.json({ data: result.data, error: null });
  } catch (error) {
    console.error('PATCH User Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
