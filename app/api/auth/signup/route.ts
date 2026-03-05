import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkLoginRateLimit } from '@/lib/rateLimit';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

type SignupRequest = z.infer<typeof signupSchema>;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate request
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;

    // Rate limit signup attempts per email
    if (!checkLoginRateLimit(email)) {
      return NextResponse.json(
        { data: null, error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { data: null, error: 'Email already registered. Please login instead.' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with USER role (not ADMIN)
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        data: {
          user: newUser,
          message: 'Account created successfully. Please login to continue.',
        },
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ data: null, error: 'Internal Server Error' }, { status: 500 });
  }
}
