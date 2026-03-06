import {
  listDepartments,
  createDepartment,
  listDepartmentMembers,
  removeDepartmentMember,
  addDepartmentMember,
  updateDepartment,
  deleteDepartment,
} from '@/lib/repositories/departmentRepository';

export async function listDepartmentsService(params: { page: number; limit: number }) {
  const { page, limit } = params;
  const skip = (page - 1) * limit;
  const departments = await listDepartments(skip, limit);
  
  // Transform the members structure to flatten user data
  const transformedDepartments = departments.map((dept: any) => ({
    id: dept.id,
    name: dept.name,
    createdAt: dept.createdAt,
    members: dept.members.map((m: any) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.user.role,
    })),
  }));
  
  return { data: { departments: transformedDepartments } };
}

export async function createDepartmentService(name: string) {
  const department = await createDepartment(name);
  return { data: { department } };
}

export async function updateDepartmentService(id: string, name: string) {
  const department = await updateDepartment(id, name);
  return { data: { department } };
}

export async function deleteDepartmentService(id: string) {
  await deleteDepartment(id);
  return { data: { success: true } };
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
