import {
  listDepartments,
  createDepartment,
  listDepartmentMembers,
  removeDepartmentMember,
  addDepartmentMember,
} from '@/lib/repositories/departmentRepository';

export async function listDepartmentsService(params: { page: number; limit: number }) {
  const { page, limit } = params;
  const skip = (page - 1) * limit;
  const departments = await listDepartments(skip, limit);
  return { data: { departments } };
}

export async function createDepartmentService(name: string) {
  const department = await createDepartment(name);
  return { data: { department } };
}

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

export async function removeDepartmentMemberService(userId: string, departmentId: string) {
  await removeDepartmentMember(userId, departmentId);
  return { data: { success: true } };
}

export async function addDepartmentMemberService(userId: string, departmentId: string) {
  const member = await addDepartmentMember(userId, departmentId);
  return { data: { member } };
}
