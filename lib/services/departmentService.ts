import {
  listDepartments,
  createDepartment,
  listDepartmentMembers,
  removeDepartmentMember,
} from '@/lib/repositories/departmentRepository';

/**
 * Lists departments with pagination (admin-only check at route level).
 * Logic copied verbatim from departments/route.ts GET.
 */
export async function listDepartmentsService(params: { page: number; limit: number }) {
  const { page, limit } = params;
  const skip = (page - 1) * limit;
  const departments = await listDepartments(skip, limit);
  return { data: { departments } };
}

/**
 * Creates a new department (admin-only check at route level).
 * Logic copied verbatim from departments/route.ts POST.
 */
export async function createDepartmentService(name: string) {
  const department = await createDepartment(name);
  return { data: { department } };
}

/**
 * Lists members of a department with pagination.
 * Logic copied verbatim from departments/[id]/members/route.ts.
 */
export async function listDepartmentMembersService(params: {
  departmentId: string;
  page: number;
  limit: number;
}) {
  const { departmentId, page, limit } = params;
  const skip = (page - 1) * limit;
  const members = await listDepartmentMembers(departmentId, skip, limit);
  return { data: { members } };
}

/**
 * Removes a user from a department (admin-only check at route level).
 * Logic copied verbatim from departments/[id]/members/[userId]/route.ts.
 */
export async function removeDepartmentMemberService(userId: string, departmentId: string) {
  await removeDepartmentMember(userId, departmentId);
  return { data: { success: true } };
}
