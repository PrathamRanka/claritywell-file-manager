import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['USER', 'ADMIN']),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['USER', 'ADMIN']),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const createRequirementSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  departmentId: z.string().min(1, 'Department is required'),
});

export const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['WYSIWYG', 'IMAGE', 'PDF', 'SPREADSHEET']),
  visibility: z.enum(['PRIVATE', 'DEPARTMENT', 'SHARED']),
  requirementId: z.string().optional(),
  folderId: z.string().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  content: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'DEPARTMENT', 'SHARED']).optional(),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  parentId: z.string().optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required'),
  parentId: z.string().optional(),
});
