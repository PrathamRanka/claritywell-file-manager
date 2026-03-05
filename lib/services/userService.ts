import { listUsers, countUsers, updateUser } from '@/lib/repositories/userRepository';

/**
 * Lists all users with pagination (admin-only check done at route level).
 * Logic copied verbatim from users/route.ts.
 */
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

/**
 * Updates a user's role or name (admin-only check done at route level).
 * Logic copied verbatim from users/[id]/route.ts.
 */
export async function updateUserService(params: {
  userId: string;
  role?: string;
  name?: string;
}) {
  const { userId, role, name } = params;
  const updatedUser = await updateUser(userId, { role, name });
  return { data: { user: updatedUser } };
}
