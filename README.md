# DocVault - Document Management System

DocVault is a modern, secure document management platform designed for organizations that require role-based access control, efficient document organization, and comprehensive audit tracking. Built with Next.js, TypeScript, and PostgreSQL, DocVault provides a scalable solution for managing documents, requirements, and collaborative workflows.

## Table of Contents

1. Overview
2. Features
3. Tech Stack
4. Architecture
5. Installation
6. Configuration
7. Database Schema
8. API Documentation
9. Frontend Components
10. Authentication & Authorization
11. Deployment
12. Development
13. Contributing

## Overview

DocVault provides a centralized document management system with the following core capabilities:

- Secure document storage with role-based permissions
- Hierarchical folder organization
- Real-time collaborative features with comments
- Requirements tracking and management
- Department-based access control
- Comprehensive audit logging
- Advanced search functionality
- Session clipboard management

The application supports three user roles:

- Admin: Full system access, user and department management
- User: Access to assigned documents and department resources
- Guest: Read-only access to shared documents

## Features

### Document Management

- Create, update, and delete documents
- Multiple document types: WYSIWYG, Image, PDF
- Three visibility levels: Private, Department, Shared
- Soft delete with restore capability
- Auto-generated thumbnails for preview
- Rich text editing with TipTap editor

### Folder Organization

- Create hierarchical folder structures
- Organize documents into folders
- Parent-child relationships for nested folders
- Bulk folder operations
- Folder-based access control

### Permissions & Sharing

- Document ACL (Access Control List) management
- Granular permissions: View, Comment, Edit
- Share documents with specific users
- Department-level sharing
- Audit trail for permission changes

### Comments & Collaboration

- Thread-based comments on documents
- Reply to comments
- Real-time comment updates
- Rich text support in comments
- Comment author attribution

### Requirements Tracking

- Create and manage client requirements
- Link requirements to documents
- Priority levels: Low, Medium, High, Urgent
- Status tracking: Open, In Progress, Review, Completed
- Due date management
- Department assignment

### Department Management

- Create and manage departments
- Add/remove members
- View department resources
- Department-based visibility
- Admin-only operations

### User Management

- Create user accounts
- Assign roles (Admin, User)
- Manage department memberships
- Edit user information
- Delete user accounts
- View user activity logs

### Administration

- Admin dashboard with statistics
- User list with management
- Department management
- Requirements overview
- Audit log access
- System metrics

### Audit & Compliance

- Complete audit logging
- Track all user actions
- Timestamp all operations
- Log audit details: action type, actor, resource, timestamp
- Filter audit logs by user, document, or action
- Audit report generation

### Search & Discovery

- Full-text search across documents
- Search document titles and content
- Search comments
- Pagination support
- Highlighting of search results

### Clipboard & Bulk Operations

- Clipboard system for copy/cut/paste
- Bulk document operations
- Move documents between folders
- Copy documents to multiple locations

## Tech Stack

### Frontend

- Next.js 14 (App Router)
- TypeScript
- React 18
- React Hook Form
- Zod validation
- TailwindCSS
- SWR (data fetching)
- Zustand (state management)
- TipTap (rich text editor)
- Lucide React (icons)
- Sonner (notifications)
- date-fns (date utilities)

### Backend

- Next.js API Routes
- NextAuth.js (authentication)
- TypeScript
- Prisma ORM
- PostgreSQL
- AWS S3 (file storage)
- Node.js runtime

### Database

- PostgreSQL
- Prisma schema management
- Migrations support

### DevOps

- Docker support
- Vercel deployment ready
- Environment-based configuration

## Architecture

### Project Structure

```
Assessment/
├── app/                              # Next.js app directory
│   ├── api/                         # API endpoints
│   │   ├── auth/                    # Authentication routes
│   │   ├── users/                   # User management
│   │   ├── departments/             # Department management
│   │   ├── documents/               # Document operations
│   │   ├── folders/                 # Folder management
│   │   ├── requirements/            # Requirement management
│   │   ├── search/                  # Search functionality
│   │   ├── audit-log/              # Audit logging
│   │   ├── clipboard/              # Clipboard operations
│   │   ├── dashboard/              # Dashboard statistics
│   │   ├── uploads/                # File upload management
│   │   └── clipboard/              # Clipboard paste operations
│   ├── documents/                   # Document pages
│   ├── folders/                     # Folder pages
│   ├── requirements/                # Requirements pages
│   ├── admin/                       # Admin panel
│   ├── search/                      # Search page
│   ├── login/                       # Login page
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Dashboard page
│   ├── globals.css                  # Global styles
│   └── error.tsx                    # Error boundary
├── components/
│   └── layout/                      # Layout components
│       ├── Sidebar.tsx              # Navigation sidebar
│       ├── Topbar.tsx               # Top navigation
│       └── ClipboardBar.tsx         # Clipboard indicator
├── lib/
│   ├── services/                    # Business logic layer
│   │   ├── userService.ts
│   │   ├── documentService.ts
│   │   ├── folderService.ts
│   │   ├── departmentService.ts
│   │   ├── requirementService.ts
│   │   ├── commentService.ts
│   │   ├── aclService.ts
│   │   ├── clipboardService.ts
│   │   ├── searchService.ts
│   │   ├── auditLogService.ts
│   │   ├── uploadService.ts
│   │   └── dashboardService.ts
│   ├── repositories/                # Data access layer
│   │   ├── userRepository.ts
│   │   ├── documentRepository.ts
│   │   ├── folderRepository.ts
│   │   ├── departmentRepository.ts
│   │   ├── requirementRepository.ts
│   │   ├── commentRepository.ts
│   │   ├── aclRepository.ts
│   │   ├── auditLogRepository.ts
│   │   └── dashboardRepository.ts
│   ├── helpers/                     # Utility helpers
│   │   ├── userContext.ts
│   │   ├── htmlSanitizer.ts
│   │   └── validations.ts
│   ├── storage/                     # Storage integration
│   │   └── s3Service.ts
│   ├── permissions.ts               # Permission logic
│   ├── validations.ts               # Zod schemas
│   ├── prisma.ts                    # Prisma client
│   ├── rateLimit.ts                # Rate limiting
│   ├── env.ts                       # Environment variables
│   └── s3.ts                        # AWS S3 configuration
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── generated/                   # Generated Prisma client
├── store/
│   └── clipboard.ts                 # Zustand clipboard store
├── types/
│   └── modules.d.ts                 # Type definitions
├── hooks/
│   └── useDebounce.ts              # Custom hooks
├── auth.ts                          # NextAuth configuration
├── next.config.js                   # Next.js config
├── tailwind.config.js              # Tailwind config
├── postcss.config.js               # PostCSS config
├── tsconfig.json                    # TypeScript config
└── package.json                     # Dependencies
```

### Data Flow

1. Client (React Component)
   - User interaction
   - Form submission

2. API Route (Next.js)
   - Request validation
   - Authentication check
   - Authorization check

3. Service Layer
   - Business logic
   - Permission verification
   - Data transformation

4. Repository Layer
   - Prisma operations
   - Database queries

5. Database (PostgreSQL)
   - Data persistence
   - Transaction management

6. Response
   - JSON response
   - Standardized format
   - Error handling

### Authentication Flow

1. User submits login credentials
2. NextAuth validates credentials
3. Session created on successful login
4. Session token stored in secure cookie
5. Subsequent requests include session
6. API routes verify session
7. User role and permissions loaded
8. Response returned with user context

## Installation

### Prerequisites

- Node.js 18.0 or higher
- PostgreSQL 13 or higher
- AWS S3 account (for file storage)
- npm or yarn package manager

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/docvault.git
cd Assessment
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Environment Configuration

Create a .env.local file in the project root:

```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/docvault"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"

# Application
NODE_ENV="development"
```

### Step 4: Database Setup

```bash
# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

### Step 5: Start Development Server

```bash
npm run dev
# or
yarn dev
```

Access the application at http://localhost:3000

### Step 6: Login

Default admin credentials:
- Email: admin@example.com
- Password: password123

## Configuration

### Environment Variables

DATABASE_URL: PostgreSQL connection string
NEXTAUTH_URL: Application URL for authentication callbacks
NEXTAUTH_SECRET: Secret key for NextAuth session encryption
AWS_REGION: AWS region for S3
AWS_ACCESS_KEY_ID: AWS access key
AWS_SECRET_ACCESS_KEY: AWS secret key
AWS_S3_BUCKET: S3 bucket name for file storage
NODE_ENV: Environment (development, production)

### Prisma Configuration

The schema.prisma file defines the database schema with:

- User model with department memberships
- Document model with ACL support
- Folder model with hierarchy
- Requirement model with status tracking
- Comment model with nesting support
- Department model with member management
- AuditLog model for tracking
- DocumentACL model for permissions

### Rate Limiting

Configure in lib/rateLimit.ts:

- Document creation: 10 requests per minute
- Comment creation: 15 requests per minute
- Authentication: 10 requests per minute
- File upload: Configurable per user

## Database Schema

### Models

User Model:
- id: Unique identifier
- email: User email (unique)
- passwordHash: Encrypted password
- role: User role (ADMIN, USER)
- name: Full name
- avatarUrl: Profile picture URL
- lastLoginAt: Last login timestamp
- createdAt: Account creation date
- Relations: documents, comments, departments

Document Model:
- id: Unique identifier
- title: Document title
- type: DocumentType (WYSIWYG, IMAGE, PDF)
- visibility: Visibility (PRIVATE, DEPARTMENT, SHARED)
- ownerId: Owner user ID
- requirementId: Linked requirement ID
- storagePath: S3 storage path
- mimeType: File MIME type
- contentHtml: HTML content
- contentExcerpt: Text preview
- thumbnailPath: Thumbnail image path
- deletedAt: Soft delete timestamp
- createdAt: Creation date
- updatedAt: Last update date
- Relations: owner, requirement, comments, acl, folders

Folder Model:
- id: Unique identifier
- name: Folder name
- parentId: Parent folder ID (for hierarchy)
- createdById: Creator user ID
- deletedAt: Soft delete timestamp
- createdAt: Creation date
- Relations: creator, items, children

Department Model:
- id: Unique identifier
- name: Department name
- createdAt: Creation date
- Relations: members, requirements

Requirement Model:
- id: Unique identifier
- clientName: Client name
- dueDate: Due date
- priority: Priority level
- status: RequirementStatus
- departmentId: Department ID
- createdById: Creator ID
- createdAt: Creation date
- Relations: department, creator, documents

Comment Model:
- id: Unique identifier
- content: Comment text
- authorsId: Author user ID
- documentId: Document ID
- parentCommentId: Parent comment ID (for nesting)
- createdAt: Creation date
- Relations: author, document, replies

DocumentACL Model:
- id: Unique identifier
- documentId: Document ID
- userId: User ID
- grantedById: Granter user ID
- canView: View permission
- canComment: Comment permission
- canEdit: Edit permission
- createdAt: Creation date

AuditLog Model:
- id: Unique identifier
- action: Action type
- userId: Actor user ID
- documentId: Document ID
- data: Action details
- createdAt: Action timestamp

### Relationships

User -> Documents (one to many)
User -> Comments (one to many)
User -> Departments (many to many through DepartmentMember)
Document -> Folder (many to many through FolderItem)
Document -> Comments (one to many)
Document -> ACL (one to many)
Document -> AuditLog (one to many)
Requirement -> Documents (one to many)
Department -> Requirements (one to many)
Department -> Users (many to many)

## API Documentation

### Authentication Endpoints

POST /api/auth/signin
- Sign in with credentials
- Request: { email, password }
- Response: Session token
- Status: 200 (success), 401 (unauthorized)

POST /api/auth/signout
- Sign out current session
- Status: 200 (success)

GET /api/auth/session
- Get current session
- Response: User object or null
- Status: 200 (success)

### User Endpoints

GET /api/users
- List all users (Admin only)
- Query: page, limit
- Response: { users, total, page, totalPages }
- Status: 200 (success), 403 (forbidden)

POST /api/users
- Create new user (Admin only)
- Request: { name, email, password, role }
- Response: { user }
- Status: 201 (created), 400 (bad request), 403 (forbidden)

PATCH /api/users/[id]
- Update user (Admin only)
- Request: { name, role }
- Response: { user }
- Status: 200 (success), 400 (bad request), 403 (forbidden)

DELETE /api/users/[id]
- Delete user (Admin only)
- Response: { success }
- Status: 200 (success), 403 (forbidden), 404 (not found)

### Department Endpoints

GET /api/departments
- List all departments (Admin only)
- Query: page, limit
- Response: { departments }
- Status: 200 (success), 403 (forbidden)

POST /api/departments
- Create department (Admin only)
- Request: { name }
- Response: { department }
- Status: 201 (created), 400 (bad request), 403 (forbidden)

POST /api/departments/[id]
- Update department (Admin only)
- Request: { name }
- Response: { department }
- Status: 200 (success), 404 (not found), 403 (forbidden)

DELETE /api/departments/[id]
- Delete department (Admin only)
- Response: { success }
- Status: 200 (success), 404 (not found), 403 (forbidden)

DELETE /api/departments/[id]/members/[userId]
- Remove member from department (Admin only)
- Response: { success }
- Status: 200 (success), 404 (not found), 403 (forbidden)

### Document Endpoints

GET /api/documents
- List documents
- Query: folderId, q, page, limit
- Response: { documents, total, page, totalPages }
- Status: 200 (success), 401 (unauthorized)

POST /api/documents/create
- Create new document
- Request: { title, type, visibility, contentHtml, requirementId, folderId, mimeType, storagePath }
- Response: { document }
- Status: 201 (created), 401 (unauthorized), 429 (rate limited)

GET /api/documents/[id]
- Get document details with comments
- Query: page, limit
- Response: { document, comments, total }
- Status: 200 (success), 404 (not found), 401 (unauthorized)

PATCH /api/documents/[id]
- Update document
- Request: { title, visibility, contentHtml }
- Response: { document }
- Status: 200 (success), 404 (not found), 403 (forbidden)

DELETE /api/documents/[id]
- Delete document (soft delete)
- Response: { success }
- Status: 200 (success), 404 (not found), 403 (forbidden)

POST /api/documents/[id]/restore
- Restore deleted document (Admin only)
- Response: { document }
- Status: 200 (success), 404 (not found), 403 (forbidden)

GET /api/documents/[id]/thumbnail
- Get document thumbnail
- Response: { thumbnailUrl }
- Status: 200 (success), 404 (not found), 401 (unauthorized)

GET /api/documents/[id]/comment
- List document comments
- Query: page, limit
- Response: { comments, total, page, totalPages }
- Status: 200 (success), 404 (not found), 401 (unauthorized)

POST /api/documents/[id]/comment
- Add comment to document
- Request: { content, parentCommentId }
- Response: { comment }
- Status: 201 (created), 401 (unauthorized), 403 (forbidden), 429 (rate limited)

POST /api/documents/[id]/acl
- Grant document access
- Request: { userId, canView, canComment, canEdit }
- Response: { acl }
- Status: 200 (success), 401 (unauthorized), 403 (forbidden)

### Folder Endpoints

GET /api/folders
- List all folders
- Response: { folders }
- Status: 200 (success), 401 (unauthorized)

POST /api/folders
- Create new folder
- Request: { name, parentId }
- Response: { folder }
- Status: 201 (created), 401 (unauthorized)

GET /api/folders/[id]
- Get folder details
- Response: { folder }
- Status: 200 (success), 404 (not found), 401 (unauthorized)

PATCH /api/folders/[id]
- Update folder
- Request: { name }
- Response: { folder }
- Status: 200 (success), 404 (not found), 403 (forbidden)

DELETE /api/folders/[id]
- Delete folder
- Response: { success }
- Status: 200 (success), 404 (not found), 403 (forbidden)

GET /api/folders/[id]/items
- List folder documents
- Query: page, limit
- Response: { items, page }
- Status: 200 (success), 404 (not found), 401 (unauthorized)

POST /api/folders/[id]/items
- Add document to folder
- Request: { documentId }
- Response: { item }
- Status: 201 (created), 400 (already in folder), 404 (not found)

### Requirement Endpoints

GET /api/requirements
- List requirements
- Query: departmentId, page, limit
- Response: { requirements, total, page, totalPages }
- Status: 200 (success), 401 (unauthorized)

POST /api/requirements
- Create requirement
- Request: { clientName, dueDate, priority, departmentId }
- Response: { requirement }
- Status: 201 (created), 401 (unauthorized)

GET /api/requirements/[id]
- Get requirement details
- Response: { requirement }
- Status: 200 (success), 404 (not found), 401 (unauthorized)

DELETE /api/requirements/[id]
- Delete requirement (Admin only)
- Response: { success }
- Status: 200 (success), 404 (not found), 403 (forbidden)

### Search Endpoints

GET /api/search
- Search documents and comments
- Query: q, page
- Response: { documents, comments }
- Status: 200 (success), 401 (unauthorized)

### Clipboard Endpoints

GET /api/clipboard
- Get clipboard state
- Response: { documentIds, action }
- Status: 200 (success), 401 (unauthorized)

POST /api/clipboard/paste
- Paste clipboard items
- Request: { documentIds, destinationFolderId, action }
- Response: { succeeded, failed }
- Status: 200 (success), 401 (unauthorized)

### Audit Log Endpoints

GET /api/audit-log
- List audit entries (Admin only)
- Query: userId, documentId, action, page, limit
- Response: { entries, total, page, totalPages }
- Status: 200 (success), 403 (forbidden)

### Dashboard Endpoints

GET /api/dashboard/stats
- Get dashboard statistics (Admin only)
- Response: { stats, recentDocuments, recentActivity }
- Status: 200 (success), 403 (forbidden)

### Upload Endpoints

POST /api/uploads/request
- Request S3 upload URL
- Request: { fileName, contentType, size }
- Response: { uploadUrl, key }
- Status: 200 (success), 401 (unauthorized), 429 (rate limited)

### Response Format

All responses follow standard format:

Success Response:
```json
{
  "data": { /* response data */ },
  "error": null
}
```

Error Response:
```json
{
  "data": null,
  "error": "Error message"
}
```

Status Codes:
- 200: OK - Successful request
- 201: Created - Resource created
- 400: Bad Request - Invalid input
- 401: Unauthorized - Authentication required
- 403: Forbidden - Authorization denied
- 404: Not Found - Resource not found
- 429: Too Many Requests - Rate limited
- 500: Internal Server Error - Server error

## Frontend Components

### Layout Components

Sidebar (components/layout/Sidebar.tsx)
- Responsive collapsible sidebar
- Folder tree navigation
- Links to main pages
- Search integration
- User menu access

Topbar (components/layout/Topbar.tsx)
- Search bar with live results
- User menu with logout
- Breadcrumb navigation
- Mobile menu toggle
- Dark mode toggle

ClipboardBar (components/layout/ClipboardBar.tsx)
- Floating clipboard indicator
- Shows copied/cut items
- Paste action button
- Clear clipboard button
- Synced with server state

### Page Components

Dashboard (app/page.tsx)
- Admin dashboard with statistics
- Recent documents list
- Recent activity for admin
- User documents for regular users
- Requirements overview

Login Page (app/login/page.tsx)
- Email and password form
- Form validation
- Error handling
- Remember me option
- Redirect to dashboard on success

Admin Panel (app/admin/page.tsx)
- Tabbed interface (Users, Departments, Requirements)
- User management with edit/delete
- Department management with members
- Requirement creation and viewing
- Batch operations support

Documents Page (app/documents/[id]/page.tsx)
- Rich text editor with TipTap
- Comments section with nesting
- Document sharing and ACL
- Document metadata
- Version history (future)

Folders Page (app/folders/[id]/page.tsx)
- Hierarchical folder navigation
- Document grid display
- Bulk operations (copy/cut/paste)
- Folder creation and management
- Upload functionality
- Pagination support

Requirements Page (app/requirements/[id]/page.tsx)
- Requirement details view
- Linked documents list
- Status tracking
- Priority display
- Timeline information

Search Page (app/search/page.tsx)
- Search form with autocomplete
- Result highlighting
- Document and comment results
- Pagination
- Advanced filters

## Authentication & Authorization

### Authentication

NextAuth.js handles authentication with:

- Credential-based login
- Secure session management
- CSRF protection
- Secure cookies
- Session refresh

Authentication Flow:
1. User enters credentials on login page
2. Request sent to NextAuth signin endpoint
3. Credentials validated against database
4. Session created if valid
5. Secure session token returned
6. Token stored in HTTP-only cookie
7. Subsequent requests include session

### Authorization

Permission system includes:

Role-Based Access Control:
- Admin: Full system access
- User: Limited access
- Guest: Read-only access

Permission Checks:
- Document visibility verification
- Folder access validation
- ACL enforcement
- Department-based access
- Method-based restrictions

### Permission Functions

canViewDocument() - Check document visibility
canEditDocument() - Check edit permission
canCommentDocument() - Check comment permission
canManageFolder() - Check folder ownership
canManageDepartment() - Check admin status
canDeleteDocument() - Check ownership or admin status

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Set environment variables
4. Configure database connection
5. Deploy
6. Access deployed application

### Docker Deployment

1. Build Docker image:
```bash
docker build -t docvault .
```

2. Run container:
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e NEXTAUTH_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  docvault
```

3. Access at http://localhost:3000

### Production Checklist

- Use strong NEXTAUTH_SECRET
- Enable HTTPS/SSL
- Configure database backup
- Set up monitoring
- Enable rate limiting
- Configure CORS properly
- Use environment variables
- Set NODE_ENV=production
- Configure S3 bucket policies
- Enable logging
- Set up error tracking

## Development

### Running Development Server

```bash
npm run dev
```

Server runs on http://localhost:3000

### Building for Production

```bash
npm run build
npm run start
```

### Linting

```bash
npm run lint
```

### Database Migrations

Create migration:
```bash
npx prisma migrate dev --name description
```

Apply migrations:
```bash
npx prisma migrate deploy
```

### Testing

Run tests:
```bash
npm test
```

### Code Structure

Features are organized in layers:

1. API Routes (app/api)
   - Request validation
   - Authentication
   - Route handling

2. Services (lib/services)
   - Business logic
   - Permission checks
   - Data transformation

3. Repositories (lib/repositories)
   - Database access
   - Prisma operations
   - Query building

4. Frontend (app, components)
   - User interface
   - Client-side logic
   - State management

### Best Practices

- Use TypeScript for type safety
- Validate all inputs
- Check permissions on backend
- Use transactions for data consistency
- Log important operations
- Handle errors gracefully
- Use environment variables
- Follow naming conventions
- Write comments for complex logic
- Test edge cases

## Contributing

Guidelines for contributing:

1. Fork the repository
2. Create feature branch (git checkout -b feature/feature-name)
3. Make changes with clear commits
4. Write or update tests
5. Follow code style
6. Submit pull request
7. Request review from maintainers

Commit Message Format:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Tests
- chore: Dependencies

Code Style:
- Use TypeScript strict mode
- 2-space indentation
- Semicolons required
- Single quotes for strings
- PascalCase for components
- camelCase for variables
- kebab-case for filenames

## Support & Documentation

For support, questions, or issues:

1. Check existing issues on GitHub
2. Create new issue with details
3. Include error messages
4. Provide reproduction steps
5. Contact maintainers

Additional Resources:
- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs
- TypeScript Handbook: https://www.typescriptlang.org/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs
- NextAuth.js Documentation: https://next-auth.js.org

## License

DocVault is proprietary software. All rights reserved.

## Version History

v1.0.0 (Current)
- Initial release
- 30 API endpoints
- Full CRUD operations
- Role-based access control
- Audit logging
- Comment system
- Requirement tracking
- Department management
- File upload support
- Advanced search

---

Last Updated: March 5, 2026
Maintained by: Development Team
