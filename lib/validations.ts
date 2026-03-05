import { z } from 'zod';

// Shared schemas
const visibilitySchema = z.enum(['PRIVATE', 'DEPARTMENT', 'SHARED']);
const documentTypeSchema = z.enum(['WYSIWYG', 'IMAGE', 'PDF']);
const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// /api/uploads/request
export const uploadRequestSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
  size: z.number().max(50 * 1024 * 1024, "File size must be 50MB or less"), // 50MB
});

// /api/documents/create
export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: documentTypeSchema,
  visibility: visibilitySchema,
  storagePath: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  contentHtml: z.string().optional().nullable(),
  requirementId: z.string().optional().nullable(),
  folderId: z.string().optional().nullable(),
});

// /api/documents/[id] (PATCH)
export const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  contentHtml: z.string().optional().nullable(),
  visibility: visibilitySchema.optional(),
});

// /api/documents/[id]/comment
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty"),
  parentCommentId: z.string().optional().nullable(),
});

// /api/folders
export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().optional().nullable(),
});

// /api/folders/[id]/items
export const addFolderItemSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
});

// /api/clipboard/paste
export const clipboardPasteSchema = z.object({
  documentIds: z.array(z.string()).min(1, "At least one document ID is required"),
  destinationFolderId: z.string().min(1, "Destination folder ID is required"),
  action: z.enum(['copy', 'cut']),
});

// /api/departments
export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
});

// /api/departments/[id]/members
export const addDepartmentMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// /api/requirements
export const createRequirementSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  dueDate: z.coerce.date(),
  priority: prioritySchema,
  departmentId: z.string().min(1, "Department ID is required"),
});
