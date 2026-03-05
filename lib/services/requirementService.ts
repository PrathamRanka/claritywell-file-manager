import {
  findRequirement,
  listRequirements,
  createRequirement,
  deleteRequirement,
  findDepartment,
} from '@/lib/repositories/requirementRepository';
import { getAccessibleDepartments, canViewRequirement } from '@/lib/permissions';
import { getUserDepartmentIds } from '@/lib/helpers/userContext';
import { prisma } from '@/lib/prisma';

export async function listRequirementsService(params: {
  userId: string;
  userRole: string;
  departmentId?: string | null;
  page: number;
  limit: number;
}) {
  const { userId, userRole, departmentId, page, limit } = params;
  const skip = (page - 1) * limit;

  const accessibleDeptIds = await getAccessibleDepartments(userId, prisma);

  let whereClause: any = {};
  if (userRole !== 'ADMIN') {
    whereClause.departmentId = { in: accessibleDeptIds };
  }

  if (departmentId) {
    if (userRole !== 'ADMIN' && !accessibleDeptIds.includes(departmentId)) {
      return { data: { requirements: [] } };
    }
    whereClause.departmentId = departmentId;
  }

  const requirements = await listRequirements(whereClause, skip, limit);
  return { data: { requirements } };
}

export async function getRequirementService(params: {
  requirementId: string;
  userId: string;
  userRole: string;
}) {
  const { requirementId, userId, userRole } = params;

  const requirement = await findRequirement(requirementId);
  if (!requirement) return { error: 'Not Found', status: 404 };

  const userDepartmentIds = await getUserDepartmentIds(userId);

  if (!canViewRequirement(userRole, userDepartmentIds, requirement)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { data: { requirement } };
}

export async function createRequirementService(params: {
  userId: string;
  clientName: string;
  dueDate: Date;
  priority: string;
  departmentId: string;
}) {
  const { userId, clientName, dueDate, priority, departmentId } = params;

  const department = await findDepartment(departmentId);
  if (!department) return { error: 'Department not found', status: 404 };

  const requirement = await createRequirement({
    clientName,
    dueDate,
    priority,
    departmentId,
    createdById: userId,
  });

  return { data: { requirement } };
}

export async function deleteRequirementService(requirementId: string) {
  await deleteRequirement(requirementId);
  return { data: { success: true } };
}
