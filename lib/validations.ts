import { z } from 'zod';

// Shared schemas
const visibilitySchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.toUpperCase() : value),
  z
    .enum(['PRIVATE', 'DEPARTMENT', 'SHARED', 'PUBLIC'])
    .transform((value) => (value === 'PUBLIC' ? 'SHARED' : value))
);
const documentTypeSchema = z.enum(['WYSIWYG', 'IMAGE', 'PDF']);
const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
const roleSchema = z.enum(['ADMIN', 'USER']);

const mimeTypeWhitelist = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'text/html'
] as const;

// /api/uploads/request
export const uploadRequestSchema = z.object({
  fileName: z.string().min(1, "File name is required").max(255),
  contentType: z.enum(mimeTypeWhitelist, {
    message: "Invalid file type. Only PNG, JPEG, PDF, and HTML are allowed."
  }),
  size: z.number().max(50 * 1024 * 1024, "File size must be 50MB or less"), // 50MB
});

// /api/documents/create
export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  type: documentTypeSchema,
  visibility: visibilitySchema,
  storagePath: z.string().max(1024).optional().nullable(),
  mimeType: z.enum(mimeTypeWhitelist).optional().nullable(),
  contentHtml: z.string().max(100000).optional().nullable(), // Max 100k for doc content
  requirementId: z.string().cuid().optional().nullable(),
  folderId: z.string().cuid().optional().nullable(),
});

// /api/documents/[id] (PATCH)
export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  contentHtml: z.string().max(100000).optional().nullable(),
  visibility: visibilitySchema.optional(),
});

// /api/documents/[id]/acl (POST)
export const updateDocumentAclSchema = z.object({
  userId: z.string().cuid(),
  canView: z.boolean().optional(),
  canComment: z.boolean().optional(),
  canEdit: z.boolean().optional(),
});

// /api/documents/[id]/comment
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty").max(5000),
  parentCommentId: z.string().cuid().optional().nullable(),
});

// /api/folders
export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255),
  parentId: z.string().cuid().optional().nullable(),
  visibility: z.enum(['PRIVATE', 'DEPARTMENT', 'SHARED']).optional(),
});

// /api/folders/[id] (PATCH)
export const updateFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(255).optional(),
  visibility: z.enum(['PRIVATE', 'DEPARTMENT', 'SHARED']).optional(),
});

// /api/folders/[id]/items
export const addFolderItemSchema = z.object({
  documentId: z.string().cuid(),
});

// /api/clipboard/paste
export const clipboardPasteSchema = z.object({
  documentIds: z.array(z.string().cuid()).min(1, "At least one document ID is required"),
  destinationFolderId: z.string().cuid(),
  action: z.enum(['copy', 'cut']),
});

// /api/departments
export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(255),
});

// /api/departments/[id]/members
export const addDepartmentMemberSchema = z.object({
  userId: z.string().cuid(),
});

// /api/requirements
export const createRequirementSchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(255),
  dueDate: z.coerce.date(),
  priority: prioritySchema,
  departmentId: z.string().cuid(),
});

// /api/users (POST) - Admin creates user
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: roleSchema,
});

// /api/users/[id] (PATCH)
export const updateUserSchema = z.object({
  role: roleSchema.optional(),
  name: z.string().min(1).max(255).optional(),
});
