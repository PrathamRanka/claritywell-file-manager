import { NextResponse } from 'next/server';
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validations";

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

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: { id: true, name: true, role: true }
    });

    return NextResponse.json({ data: { user: updatedUser }, error: null });
  } catch (error) {
    console.error('PATCH User Error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
