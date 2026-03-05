import { listUsers, countUsers, updateUser, deleteUser } from '@/lib/repositories/userRepository';

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
