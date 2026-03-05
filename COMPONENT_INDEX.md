# Component Index - Quick Reference

## UI Components (`components/ui/`)

All generic, reusable UI components. Import from `@/components/ui`.

### Badge
**Purpose**: Display status or category labels  
**Props**: `variant` (default, success, warning, danger), `children`  
**Example**: `<Badge variant="success">Active</Badge>`

### Button
**Purpose**: Interactive button with variants and loading state  
**Props**: `variant` (primary, secondary, danger, ghost), `isLoading`, `icon`, `children`, `onClick`  
**Example**: `<Button variant="primary" isLoading={saving}>Save</Button>`

### Card
**Purpose**: Container with border and padding  
**Props**: `children`, `className`  
**Example**: `<Card>Content here</Card>`

### EmptyState
**Purpose**: Display when no data is available  
**Props**: `icon`, `title`, `description`, `action`  
**Example**: `<EmptyState icon={FileIcon} title="No documents" description="Upload your first document" />`

### Input
**Purpose**: Text input with label and error display  
**Props**: `label`, `error`, `icon`, `type`, standard HTML input props  
**Example**: `<Input label="Email" error={errors.email} {...register('email')} />`

### LoadingSpinner
**Purpose**: Loading indicator with optional message  
**Props**: `size` (sm, md, lg), `message`  
**Example**: `<LoadingSpinner message="Loading documents..." />`

### Modal
**Purpose**: Dialog overlay with backdrop  
**Props**: `isOpen`, `onClose`, `title`, `footer`, `children`, `size` (sm, md, lg, xl)  
**Example**: 
```tsx
<Modal isOpen={open} onClose={() => setOpen(false)} title="Edit User" footer={<Button>Save</Button>}>
  Form content here
</Modal>
```

### Select
**Purpose**: Dropdown select with label  
**Props**: `label`, `options` (array of `{value, label}`), `error`, standard select props  
**Example**: `<Select label="Department" options={deptOptions} {...register('departmentId')} />`

### Skeleton
**Purpose**: Loading placeholder matching content shape  
**Props**: `className` (optional custom styles)  
**Example**: `<Skeleton className="h-20 w-full" />`

### StatCard
**Purpose**: Dashboard statistic display  
**Props**: `icon`, `title`, `value`  
**Example**: `<StatCard icon={FileText} title="Total Documents" value={stats.documents} />`

---

## Feature Components

### Admin (`components/features/admin/`)

#### UsersTab
**Purpose**: User management interface  
**Props**: `users`, `mutate`  
**Features**: Create, edit, delete users; role assignment  
**Used in**: Admin Page

#### DepartmentsTab
**Purpose**: Department management interface  
**Props**: `departments`, `mutate`  
**Features**: Create, edit, delete departments; member management  
**Used in**: Admin Page

#### RequirementsTab
**Purpose**: Requirements management interface  
**Props**: `requirements`, `departments`, `mutate`  
**Features**: Create, edit requirements; priority/status management  
**Used in**: Admin Page

---

### Documents (`components/features/documents/`)

#### DocumentGrid
**Purpose**: Display documents in a responsive grid  
**Props**: `documents`, `onContextMenu`  
**Features**: Document cards with metadata, context menu trigger  
**Used in**: Folder Page, Requirements Page

#### DocumentHeader
**Purpose**: Document metadata and toolbar  
**Props**: `document`, `saveStatus`, `onShare`, `onDownload`  
**Features**: Save status indicator, share/download buttons, metadata display  
**Used in**: Document Page

#### RichTextEditor
**Purpose**: TipTap WYSIWYG editor with toolbar  
**Props**: `content`, `editable`, `onUpdate`  
**Features**: Bold, italic, headings, lists, formatting toolbar  
**Used in**: Document Page

#### CommentsSection
** Purpose**: Display and submit comments with threading  
**Props**: `comments`, `onAddComment`, `isLoading`  
**Features**: Nested replies, comment tree rendering, reply form  
**Used in**: Document Page

#### ShareModal
**Purpose**: Document sharing interface  
**Props**: `isOpen`, `onClose`, `onShare`  
**Features**: User search, access control  
**Used in**: Document Page

#### VisibilityBadge
**Purpose**: Display document visibility status  
**Props**: `visibility` (PRIVATE, DEPARTMENT, SHARED)  
**Features**: Color-coded badges with icons  
**Used in**: Document Grid, Document Header

---

### Folders (`components/features/folders/`)

#### Breadcrumbs
**Purpose**: Folder navigation path  
**Props**: `folders` (array of folder objects with `id`, `name`, `parent`)  
**Features**: Clickable path navigation from root to current folder  
**Used in**: Folder Page

#### UploadManager
**Purpose**: File upload UI with progress tracking  
**Props**: `uploads` (Map of upload states), `onUpload`, `onCancel`  
**Features**: Progress bars, cancel upload, upload status icons  
**Used in**: Folder Page

#### ContextMenu
**Purpose**: Right-click context menu for documents  
**Props**: `x`, `y`, `onCopy`, `onCut`, `onDelete`, `onClose`  
**Features**: Copy, cut, delete actions; positioned at click location  
**Used in**: Folder Page

---

### Requirements (`components/features/requirements/`)

#### RequirementHeader
**Purpose**: Requirement title and metadata  
**Props**: `requirement`  
**Features**: Client name, deadline, priority, status badges  
**Used in**: Requirement Page

#### PriorityBadge
**Purpose**: Display requirement priority  
**Props**: `priority` (LOW, MEDIUM, HIGH, CRITICAL)  
**Features**: Color-coded with icons from config  
**Used in**: Requirement Header, Requirements Tab

#### StatusBadge
**Purpose**: Display requirement status  
**Props**: `status` (DRAFT, IN_PROGRESS, REVIEW, APPROVED, ON_HOLD)  
**Features**: Color-coded with icons from config  
**Used in**: Requirement Header, Requirements Tab

---

### Search (`components/features/search/`)

#### SearchInput
**Purpose**: Search input with debounce  
**Props**: `initialQuery`  
**Features**: Auto-submit on input, debounced API calls  
**Used in**: Search Page

#### SearchResults
**Purpose**: Display search results with highlighting  
**Props**: `results`, `query`, `isLoading`  
**Features**: Separate document and comment results, highlight matches  
**Used in**: Search Page

---

## Custom Hooks (`hooks/`)

### useDocument(id)
**Returns**: `{ document, isLoading, mutate }`  
**Purpose**: Fetch single document  
**Example**: `const { document } = useDocument(documentId);`

### useDocuments()
**Returns**: `{ documents, isLoading, mutate }`  
**Purpose**: Fetch all documents  

### useFolder(id)
**Returns**: `{ folder, isLoading, mutate }`  
**Purpose**: Fetch single folder with parent chain  

### useFolders()
**Returns**: `{ folders, isLoading, mutate }`  
**Purpose**: Fetch all folders  

### useFolderItems(folderId, page, pageSize)
**Returns**: `{ items, total, isLoading, mutate }`  
**Purpose**: Fetch paginated folder contents  

### useRequirement(id)
**Returns**: `{ requirement, isLoading, mutate }`  
**Purpose**: Fetch single requirement  

### useRequirements()
**Returns**: `{ requirements, isLoading, mutate }`  
**Purpose**: Fetch all requirements  

### useUsers()
**Returns**: `{ users, isLoading, mutate }`  
**Purpose**: Fetch all users  

### useDepartments()
**Returns**: `{ departments, isLoading, mutate }`  
**Purpose**: Fetch all departments  

### useComments(documentId)
**Returns**: `{ comments, isLoading, mutate }`  
**Purpose**: Fetch comments for a document  
**Note**: Also exports `buildCommentTree()` helper

### useDashboardStats()
**Returns**: `{ stats, isLoading }`  
**Purpose**: Fetch dashboard statistics  

### useModal()
**Returns**: `{ isOpen, open, close }`  
**Purpose**: Modal state management  

### useContextMenu<T>()
**Returns**: `{ isOpen, position, data, open, close }`  
**Purpose**: Context menu state and positioning  
**Generic**: Type parameter for context menu data  

### usePagination(initialPage?, initialPageSize?)
**Returns**: `{ page, pageSize, setPage, setPageSize }`  
**Purpose**: Pagination state  

---

## Constants (`lib/constants/`)

### config.ts
- `PRIORITY_CONFIG`: Priority levels with colors and icons
- `STATUS_CONFIG`: Requirement statuses with colors and icons
- `VISIBILITY_CONFIG`: Document visibility options with colors and icons
- `PRIORITIES`: Array of priority values
- `STATUSES`: Array of status values
- `VISIBILITIES`: Array of visibility values

### schemas.ts
- `loginSchema`: Login form validation
- `createUserSchema`: User creation validation
- `updateUserSchema`: User update validation
- `departmentSchema`: Department validation
- `requirementSchema`: Requirement validation
- `documentSchema`: Document validation
- `commentSchema`: Comment validation

---

## Utilities (`lib/utils/`)

### formatters.tsx
- `formatDate(date, formatStr?)`: Format date to readable string
- `formatRelativeTime(date)`: Format date as "2 hours ago"
- `highlightText(text, query)`: Return text with highlighted search matches
- `truncateText(text, maxLength)`: Truncate with ellipsis
- `formatFileSize(bytes)`: Format bytes to KB/MB/GB

### api.ts
- `fetcher(url)`: SWR fetcher with error handling
- `apiRequest(url, options)`: Fetch wrapper with JSON headers

---

## Import Examples

```tsx
// UI Components
import { Button, Input, Modal, LoadingSpinner } from '@/components/ui';

// Feature Components
import { DocumentGrid } from '@/components/features/documents/DocumentGrid';
import { UsersTab } from '@/components/features/admin/UsersTab';

// Hooks
import { useDocument } from '@/hooks/useDocument';
import { useModal } from '@/hooks/useModal';

// Constants
import { PRIORITY_CONFIG } from '@/lib/constants/config';
import { loginSchema } from '@/lib/constants/schemas';

// Utils
import { formatDate, formatRelativeTime } from '@/lib/utils/formatters';
import { fetcher } from '@/lib/utils/api';
```

---

## Finding Components

**By Feature**:
- Admin management → `components/features/admin/`
- Documents → `components/features/documents/`
- Folders → `components/features/folders/`
- Requirements → `components/features/requirements/`
- Search → `components/features/search/`

**By Type**:
- Generic UI → `components/ui/`
- Data fetching → `hooks/`
- Validation → `lib/constants/schemas.ts`
- Configuration → `lib/constants/config.ts`
- Formatting → `lib/utils/formatters.tsx`

**By Use Case**:
- Forms → `Input`, `Select`, `Button`, schemas from `lib/constants/schemas`
- Loading states → `LoadingSpinner`, `Skeleton`
- Data display → `Card`, `Badge`, `StatCard`
- User interactions → `Modal`, `ContextMenu`, `Button`
- Date/time → `formatDate`, `formatRelativeTime`
