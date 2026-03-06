import { listUsers, countUsers, updateUser, deleteUser } from '@/lib/repositories/userRepository';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function createUserService(params: {
  email: string;
  password: string;
  name: string;
  role: string;
}) {
  const { email, password, name, role } = params;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { 
      error: 'Email already registered', 
      status: 409 
    };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: role as any,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return { data: { user: newUser } };
}

export async function listUsersService(params: { page: number; limit: number }) {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([listUsers(skip, limit), countUsers()]);

  return {
    data: {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function updateUserService(params: {
  userId: string;
  role?: string;
  name?: string;
}) {
  const { userId, role, name } = params;
  const updatedUser = await updateUser(userId, { role, name });
  return { data: { user: updatedUser } };
}

export async function deleteUserService(userId: string) {
  const deletedUser = await deleteUser(userId);
  return { data: { user: deletedUser } };
}
