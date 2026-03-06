# DocVault - Enterprise Document Management System

A production-ready, secure document management system with role-based access control, department management, and comprehensive audit logging. Built with Next.js 14, TypeScript, PostgreSQL, and Supabase Storage.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [Feature Implementation Status](#feature-implementation-status)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Production Deployment](#production-deployment)

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 13+ database
- Supabase account (for S3-compatible storage) or AWS S3

### Local Setup

**1. Clone and Install**

```bash
git clone <repository-url>
cd Assessment
npm install
```

**2. Configure Environment Variables**

Create `.env.local` file in the project root:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@localhost:5432/docvault"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Supabase S3-Compatible Storage (or AWS S3)
SUPABASE_S3_REGION="ap-south-1"
SUPABASE_S3_ENDPOINT="https://<project-ref>.supabase.co/storage/v1/s3"
SUPABASE_S3_ACCESS_KEY_ID="your-access-key-id"
SUPABASE_S3_SECRET_ACCESS_KEY="your-secret-access-key"
SUPABASE_S3_BUCKET_NAME="documents"
```

**3. Initialize Database**

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database with sample data (optional)
node seed.js
```

**4. Start Development Server**

```bash
npm run dev
```

Visit http://localhost:3000

**5. Default Admin Credentials**

After seeding, login with:
- **Email:** `admin@docvault.com`
- **Password:** `admin123`

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | Application base URL for auth callbacks | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Secret key for session encryption (32+ chars) | Generated with `openssl rand -base64 32` |
| `SUPABASE_S3_REGION` | S3 region or "auto" for Supabase | `ap-south-1` or `auto` |
| `SUPABASE_S3_ENDPOINT` | S3 endpoint URL | `https://xyz.supabase.co/storage/v1/s3` |
| `SUPABASE_S3_ACCESS_KEY_ID` | S3 access key ID | Your access key |
| `SUPABASE_S3_SECRET_ACCESS_KEY` | S3 secret access key | Your secret key |
| `SUPABASE_S3_BUCKET_NAME` | S3 bucket name for document storage | `documents` |

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Setting up Supabase Storage

1. Create a Supabase project at https://supabase.com
2. Navigate to Storage → Create new bucket → Name it "documents"
3. Go to Settings → API → Find S3 endpoint and credentials
4. Copy credentials to `.env.local`

---

---

## Architecture & Design Decisions

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Next.js App Router (UI)         │
│     React Components + Server Actions    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          API Routes Layer               │
│  Authentication, Validation, Rate Limit  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│        Service Layer (Business Logic)    │
│   documentService, userService, etc.     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Repository Layer (Data Access)       │
│  Prisma ORM + Database Queries          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│          PostgreSQL Database             │
└─────────────────────────────────────────┘
```

### Key Architecture Decisions

#### 1. **Monolithic Next.js Architecture**
- **Choice:** Single Next.js application with API routes
- **Rationale:** Simplifies deployment, reduces complexity, and leverages Next.js server-side capabilities
- **Tradeoff:** Less scalable than microservices but faster development and easier maintenance
- **Alternative:** Separate frontend/backend would add deployment complexity

#### 2. **Layered Service Architecture**
- **Choice:** Service Layer → Repository Layer → Database
- **Rationale:** 
  - Services contain business logic and permission checks
  - Repositories handle data access (Prisma queries)
  - Clear separation of concerns improves testability
- **Tradeoff:** More files/abstraction but better organized code
- **Benefit:** Easy to refactor, test, and maintain

#### 3. **Server-Side Upload with Signed URLs**
- **Choice:** Client → Request signed URL → Direct upload to S3 → Save metadata
- **Rationale:** 
  - Reduces server bandwidth (no data pass-through)
  - Faster uploads (direct to storage)
  - Server-side security (service keys never exposed)
- **Tradeoff:** Slightly more complex flow but much more scalable
- **Alternative:** Uploading through server would create bandwidth bottleneck

#### 4. **PostgreSQL + Prisma ORM**
- **Choice:** PostgreSQL with Prisma for database access
- **Rationale:**
  - PostgreSQL: Robust, supports full-text search, JSONB for metadata
  - Prisma: Type-safe queries, automatic migrations, great DX
- **Tradeoff:** Prisma adds abstraction layer but improves developer productivity
- **Benefit:** Full-text search for documents using `ts_rank` and `to_tsvector`

#### 5. **Client-Side State Management (Zustand)**
- **Choice:** Zustand for global clipboard state
- **Rationale:** Lightweight, simple API, no boilerplate like Redux
- **Tradeoff:** Less structured than Redux but perfect for simple state needs
- **Alternative:** Redux would be overkill for clipboard-only state

#### 6. **NextAuth.js for Authentication**
- **Choice:** NextAuth.js with Credentials Provider
- **Rationale:**
  - Built for Next.js, handles sessions, CSRF, cookies securely
  - Extensible for OAuth providers
- **Tradeoff:** Tied to Next.js ecosystem but perfect integration
- **Alternative:** Custom JWT auth would require more security work

#### 7. **Soft Deletes**
- **Choice:** `deletedAt` timestamp instead of hard deletes
- **Rationale:** 
  - Enables restore functionality
  - Maintains audit trail
  - Prevents accidental data loss
- **Tradeoff:** Requires filtering `deletedAt IS NULL` in queries
- **Benefit:** Compliance and data recovery

#### 8. **Permission Model: Visibility + ACL**
- **Choice:** Document-level visibility (PRIVATE/DEPARTMENT/SHARED) + explicit ACL
- **Rationale:**
  - PRIVATE: Simple owner-only access
  - DEPARTMENT: Automatic access for department members
  - SHARED: Explicit per-user permissions (view/comment/edit)
- **Tradeoff:** More complex logic but flexible permission model
- **Benefit:** Covers all use cases without over-engineering

#### 9. **Rate Limiting (In-Memory)**
- **Choice:** In-memory Map for rate limiting
- **Rationale:** Simple, fast, no external dependencies
- **Tradeoff:** Resets on server restart, not shared across instances
- **Production Alternative:** Redis for distributed rate limiting

#### 10. **SWR for Data Fetching**
- **Choice:** SWR (stale-while-revalidate) for client-side data fetching
- **Rationale:**
  - Automatic caching and revalidation
  - Focus on user experience (show cached data immediately)
  - Built-in error handling and retry logic
- **Tradeoff:** More network requests but better UX
- **Alternative:** React Query has more features but SWR is simpler

---

## Feature Implementation Status

### FULLY IMPLEMENTED (Production Ready)

| Feature | Status | Notes |
|---------|--------|-------|
| **User Authentication** | Complete | Login/logout with NextAuth, secure sessions |
| **User Registration** | Complete | Self-signup + admin user creation |
| **Admin User Management** | Complete | Create, update, delete users (admin-only) |
| **Department Management** | Complete | CRUD operations, member management |
| **Requirement Creation** | Complete | Create requirements assigned to departments |
| **Document Upload Flow** | Complete | Signed URLs (15min expiry), direct S3 upload |
| **Document CRUD** | Complete | Create, read, update, soft delete, restore |
| **Document Permissions** | Complete | PRIVATE, DEPARTMENT, SHARED (ACL) |
| **Folder Management** | Complete | Hierarchical folders, CRUD operations |
| **Clipboard (Copy/Cut/Paste)** | Complete | Client state + server validation on paste |
| **Comments System** | Complete | Nested comments, permission checks |
| **Search** | Complete | PostgreSQL full-text search with ranking |
| **Audit Logging** | Complete | All actions logged with metadata |
| **Input Validation** | Complete | Zod schemas on every endpoint |
| **Rate Limiting** | Complete | Per-user limits on uploads, comments, etc. |
| **HTML Sanitization** | Complete | DOMPurify for WYSIWYG content |
| **Signed Download URLs** | Complete | Short-lived (15min) download links |
| **Dashboard Stats** | Complete | Admin dashboard with metrics |
| **Pagination** | Complete | Server-side pagination on all lists |
| **Soft Deletes** | Complete | Restore capability for documents |

### PARTIAL / OMITTED FEATURES

| Feature | Status | Notes |
|---------|--------|-------|
| **Real-time Sync (WebSockets)** | Partial | Service exists but not fully integrated in UI |
| **2FA (Two-Factor Auth)** | Partial | Backend ready, frontend setup page incomplete (see [docs/2FA_IMPLEMENTATION.md](docs/2FA_IMPLEMENTATION.md)) |
| **Email Notifications** | Omitted | Would require SMTP/email service integration |
| **Document Versioning** | Omitted | Complex feature, deferred for MVP |
| **Advanced ACL Inheritance** | Omitted | Folder-level permissions don't cascade to documents |
| **Thumbnail Generation** | Partial | Service exists but requires Sharp library for images |
| **Bulk Upload** | Omitted | Single file upload only |
| **Export to ZIP** | Omitted | No bulk download feature |
| **Mobile App** | Out of Scope | Web-only responsive design |

---

## Bonus Features Implemented

### 1. PostgreSQL Full-Text Search
- Advanced search using `ts_rank` and `to_tsvector`
- Ranks results by relevance
- Searches document titles, content excerpts, and comments
- **File:** [lib/services/searchServiceAdvanced.ts](lib/services/searchServiceAdvanced.ts)

### 2. Comprehensive Audit Logging
- Every document action logged (CREATE, EDIT, DELETE, MOVE, COPY, SHARE)
- Includes metadata (what changed, by whom, when)
- Admin-only audit log viewer with filters
- **File:** [lib/repositories/auditLogRepository.ts](lib/repositories/auditLogRepository.ts)

### 3. Clipboard with Success/Failure Tracking
- Global Zustand store for clipboard state
- Paste operation validates each document individually
- Returns `{succeeded: [], failed: [{id, reason}]}`
- UI shows detailed per-file errors
- **File:** [lib/services/clipboardService.ts](lib/services/clipboardService.ts)

### 4. Admin Dashboard with Real-time Stats
- Total users, documents, departments, requirements
- Recent activity feed
- Quick actions for user/department management
- **File:** [lib/services/dashboardService.ts](lib/services/dashboardService.ts)

### 5. Hierarchical Folder System
- Parent-child folder relationships
- Nested folder navigation
- Move documents between folders
- **File:** [lib/services/folderService.ts](lib/services/folderService.ts)

### 6. Rate Limiting Per User
- 20 uploads/hour
- 50 document creations/hour
- 100 comments/hour
- 30 folder creations/hour
- **File:** [lib/rateLimit.ts](lib/rateLimit.ts)

### 7. Soft Delete + Restore
- Documents marked with `deletedAt` timestamp
- Admin can restore deleted documents
- Maintains audit trail even for deleted items
- **Endpoint:** `POST /api/documents/:id/restore`

### 8. HTML Content Sanitization
- Server-side sanitization with DOMPurify (isomorphic)
- Prevents XSS attacks in WYSIWYG documents
- Generates content excerpts for previews
- **File:** [lib/helpers/htmlSanitizer.ts](lib/helpers/htmlSanitizer.ts)

### 9. Department-Based Permissions
- Requirements assigned to departments
- Department members automatically see department documents
- Admin can manage department memberships
- **File:** [lib/permissions.ts](lib/permissions.ts)

### 10. 2FA Infrastructure (Backend Ready)
- TOTP-based 2FA with Speakeasy
- QR code generation for authenticator apps
- Backup codes for account recovery
- API endpoints ready, frontend integration partial
- **Files:** [lib/services/twoFactorAuthService.ts](lib/services/twoFactorAuthService.ts), [docs/2FA_IMPLEMENTATION.md](docs/2FA_IMPLEMENTATION.md)

---

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.3
- **UI Library:** React 18
- **Styling:** TailwindCSS 3.4
- **Forms:** React Hook Form + Zod validation
- **State Management:** Zustand (clipboard), SWR (data fetching)
- **Rich Text:** TipTap (WYSIWYG editor)
- **Icons:** Lucide React
- **Notifications:** Sonner (toast)

### Backend
- **Runtime:** Node.js 18+
- **API:** Next.js API Routes
- **Authentication:** NextAuth.js 4
- **ORM:** Prisma 7.4
- **Database:** PostgreSQL 13+
- **Storage:** Supabase Storage (S3-compatible) / AWS S3
- **Validation:** Zod
- **Security:** bcrypt, DOMPurify (isomorphic), CSRF protection

### DevOps & Tools
- **Package Manager:** npm
- **Linting:** ESLint
- **Type Checking:** TypeScript Compiler
- **Database Migrations:** Prisma Migrate
- **Environment Variables:** .env.local

---

## Database Schema

### Core Models

```prisma
model User {
  id                    String             @id @default(cuid())
  email                 String             @unique
  passwordHash          String
  role                  Role               // ADMIN | USER
  name                  String
  avatarUrl             String?
  lastLoginAt           DateTime?
  createdAt             DateTime           @default(now())
  
  // Relations
  departmentMemberships DepartmentMember[]
  documentsCreated      Document[]
  comments              Comment[]
  documentAcls          DocumentACL[]
  auditLogs             AuditLog[]
}

model Department {
  id           String             @id @default(cuid())
  name         String             @unique
  createdAt    DateTime           @default(now())
  members      DepartmentMember[]
  requirements Requirement[]
}

model Requirement {
  id           String            @id @default(cuid())
  clientName   String
  dueDate      DateTime
  priority     Priority          // LOW | MEDIUM | HIGH | URGENT
  status       RequirementStatus // OPEN | IN_PROGRESS | REVIEW | COMPLETED
  departmentId String
  createdById  String
  createdAt    DateTime          @default(now())
  
  // Relations
  department   Department
  documents    Document[]
}

model Document {
  id             String        @id @default(cuid())
  title          String
  type           DocumentType  // WYSIWYG | IMAGE | PDF
  visibility     Visibility    // PRIVATE | DEPARTMENT | SHARED
  ownerId        String
  requirementId  String?
  storagePath    String?       // S3 key
  mimeType       String?
  contentHtml    String?       // For WYSIWYG docs
  contentExcerpt String?       // Search preview
  thumbnailPath  String?
  deletedAt      DateTime?     // Soft delete
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  // Relations
  owner          User
  requirement    Requirement?
  folderItems    FolderItem[]
  comments       Comment[]
  acl            DocumentACL[]
}

model DocumentACL {
  id           String   @id @default(cuid())
  documentId   String
  userId       String
  grantedById  String?
  canEdit      Boolean  @default(false)
  canComment   Boolean  @default(false)
  canView      Boolean  @default(true)
  createdAt    DateTime @default(now())
  
  @@unique([documentId, userId])
}

model Folder {
  id          String       @id @default(cuid())
  name        String
  parentId    String?      // For nested folders
  createdById String
  deletedAt   DateTime?
  createdAt   DateTime     @default(now())
  
  // Relations
  items       FolderItem[]
  children    Folder[]     @relation("FolderHierarchy")
  parent      Folder?      @relation("FolderHierarchy")
}

model Comment {
  id              String    @id @default(cuid())
  content         String
  authorId        String
  documentId      String
  parentCommentId String?   // For nested replies
  createdAt       DateTime  @default(now())
  
  // Relations
  author          User
  document        Document
  replies         Comment[] @relation("CommentReplies")
  parent          Comment?  @relation("CommentReplies")
}

model AuditLog {
  id         String      @id @default(cuid())
  action     AuditAction // CREATE | EDIT | DELETE | MOVE | COPY | SHARE
  userId     String
  documentId String?
  metadata   Json?       // Additional action details
  createdAt  DateTime    @default(now())
  
  // Relations
  user       User
}
```

### Relationships Summary

- **User ↔ Department:** Many-to-many via `DepartmentMember`
- **User → Documents:** One-to-many (owner)
- **Document ↔ Folder:** Many-to-many via `FolderItem`
- **Document → Comments:** One-to-many
- **Document → ACL:** One-to-many (explicit permissions)
- **Requirement → Documents:** One-to-many
- **Folder → Folder:** Self-referential for hierarchy

---

---

## API Documentation

### Authentication

```http
POST /api/auth/[...nextauth]
```
NextAuth.js handles login/logout. Use NextAuth signIn/signOut functions.

```http
POST /api/auth/signup
Body: { email, password, name }
Response: { user } (creates USER role only)
```

### Admin User Management

```http
POST /api/users
Headers: Admin authentication required
Body: { email, password, name, role: "ADMIN" | "USER" }
Response: { user }
```

```http
GET /api/users?page=1&limit=50
Headers: Admin authentication required
Response: { users, total, page, totalPages }
```

```http
PATCH /api/users/:id
Headers: Admin authentication required
Body: { role?, name? }
Response: { user }
```

```http
DELETE /api/users/:id
Headers: Admin authentication required
Response: { success }
```

### Departments

```http
POST /api/departments
Headers: Admin authentication required
Body: { name }
Response: { department }
```

```http
POST /api/departments/:id/members
Headers: Admin authentication required
Body: { userId }
Response: { member }
```

### Requirements

```http
POST /api/requirements
Body: { clientName, dueDate, priority, departmentId }
Response: { requirement }
```

```http
GET /api/requirements?departmentId=&page=1
Response: { requirements }
```

### Upload Flow

```http
# Step 1: Request signed URL
POST /api/uploads/request
Body: { fileName, contentType, size }
Response: { uploadUrl, fileKey, expiresAt }

# Step 2: Client uploads directly to uploadUrl (PUT request)

# Step 3: Save document metadata
POST /api/documents/create
Body: { title, type, visibility, storagePath: fileKey, requirementId?, folderId? }
Response: { document }
```

### Documents

```http
GET /api/documents?folderId=&q=&page=1&limit=20
Response: { documents, total }
```

```http
GET /api/documents/:id
Response: { document, comments, signedDownloadUrl }
```

```http
PATCH /api/documents/:id
Body: { title?, visibility?, contentHtml? }
Response: { document }
```

```http
DELETE /api/documents/:id
Response: { success } (soft delete)
```

```http
POST /api/documents/:id/restore
Headers: Admin authentication required
Response: { document }
```

```http
POST /api/documents/:id/comment
Body: { content, parentCommentId? }
Response: { comment }
```

```http
POST /api/documents/:id/acl
Body: { userId, canView?, canComment?, canEdit? }
Response: { acl }
```

### Folders

```http
POST /api/folders
Body: { name, parentId? }
Response: { folder }
```

```http
POST /api/folders/:id/items
Body: { documentId }
Response: { item }
```

### Clipboard

```http
POST /api/clipboard/paste
Body: { documentIds: [], destinationFolderId, action: "copy" | "cut" }
Response: { succeeded: [], failed: [{ id, reason }] }
```

### Search

```http
GET /api/search?q=query&page=1
Response: { documents, comments, total }
```

### Audit Logs

```http
GET /api/audit-log?userId=&documentId=&action=&page=1
Headers: Admin authentication required
Response: { entries, total }
```

### Response Format

**Success:**
```json
{
  "data": { /* result */ },
  "error": null
}
```

**Error:**
```json
{
  "data": null,
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

---

## Security Features

### Implemented Security Measures

1. **Authentication & Sessions**
   - NextAuth.js with secure HTTP-only cookies
   - CSRF protection built-in
   - Session refresh on activity
   - Bcrypt password hashing (10 rounds)

2. **Authorization & Permissions**
   - Server-side permission checks on every API route
   - Role-based access control (ADMIN/USER)
   - Document-level ACL (view/comment/edit)
   - Department-based visibility

3. **Input Validation**
   - Zod schemas on all API endpoints
   - Type-safe validation
   - MIME type whitelist (PNG, JPEG, PDF, HTML only)
   - File size limits (50MB max)

4. **HTML Sanitization**
   - DOMPurify server-side for WYSIWYG content
   - Prevents XSS attacks
   - Sanitizes before saving to database

5. **Rate Limiting**
   - Per-user rate limits:
     - 20 uploads/hour
     - 50 document creations/hour
     - 100 comments/hour
     - 10 login attempts per 5 minutes
   - IP-based rate limiting on sensitive endpoints

6. **Signed URLs for Storage**
   - Short-lived signed URLs (15 minutes max)
   - Service keys never exposed to client
   - Upload URL expires after 15 minutes
   - Download URLs regenerated on each request

7. **Soft Deletes**
   - Documents marked with `deletedAt` instead of hard delete
   - Maintains audit trail
   - Admin can restore deleted items

8. **Audit Logging**
   - All document actions logged
   - Includes user, timestamp, action type, metadata
   - Admin-only access to logs

9. **Environment Variable Validation**
   - Required variables checked on startup
   - Application fails fast if misconfigured

10. **SQL Injection Protection**
    - Prisma ORM with parameterized queries
    - No raw SQL concatenation

### Production Recommendations

- **HTTPS:** Deploy behind HTTPS (Vercel/Cloudflare)
- **Secrets:** Use `openssl rand -base64 32` for NEXTAUTH_SECRET
- **Database:** Enable SSL for PostgreSQL connection
- **Storage:** Configure S3 bucket CORS and policies
- **Rate Limiting:** Use Redis for distributed rate limiting
- **Monitoring:** Add Sentry or LogRocket for error tracking
- **Backups:** Automated daily database backups

---

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
---

## Production Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Environment Variables**
   Add all variables from `.env.local` in Vercel dashboard

4. **Deploy**
   Vercel automatically builds and deploys

5. **Database**
   - Use Vercel Postgres or external PostgreSQL (Supabase, Railway, Neon)
   - Run migrations: `npx prisma migrate deploy`

### Docker Deployment

**Build Image:**
```bash
docker build -t docvault .
```

**Run Container:**
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="https://yourdomain.com" \
  -e NEXTAUTH_SECRET="..." \
  -e SUPABASE_S3_REGION="..." \
  -e SUPABASE_S3_ENDPOINT="..." \
  -e SUPABASE_S3_ACCESS_KEY_ID="..." \
  -e SUPABASE_S3_SECRET_ACCESS_KEY="..." \
  -e SUPABASE_S3_BUCKET_NAME="..." \
  docvault
```

### Manual Server Deployment

```bash
# 1. Install dependencies
npm install --production

# 2. Build application
npm run build

# 3. Run migrations
npx prisma migrate deploy

# 4. Start server
npm start
```

### Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET` (32+ characters)
- [ ] Enable HTTPS/SSL certificate
- [ ] Configure database connection pooling
- [ ] Set up automated database backups
- [ ] Configure S3 bucket CORS policies
- [ ] Enable server-side logging (Winston, Pino)
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for static assets
- [ ] Enable PostgreSQL SSL connection
- [ ] Set `NODE_ENV=production`
- [ ] Test all permission scenarios
- [ ] Load test API endpoints
- [ ] Review rate limit configurations

---

## Project Structure

```
Assessment/
├── app/                              # Next.js app directory
│   ├── api/                         # API endpoints
│   │   ├── auth/                    # Authentication (NextAuth + signup)
│   │   ├── users/                   # User management (admin)
│   │   ├── departments/             # Department CRUD
│   │   ├── documents/               # Document operations
│   │   ├── folders/                 # Folder management
│   │   ├── requirements/            # Requirement tracking
│   │   ├── search/                  # Full-text search
│   │   ├── audit-log/              # Audit logging
│   │   ├── clipboard/              # Clipboard paste
│   │   ├── dashboard/              # Dashboard stats
│   │   └── uploads/                # Upload signed URL request
│   ├── documents/[id]/             # Document detail pages
│   ├── folders/[id]/               # Folder pages
│   ├── requirements/[id]/          # Requirements pages
│   ├── admin/                       # Admin panel
│   ├── search/                      # Search page
│   ├── login/                       # Login page
│   ├── signup/                      # Self-registration page
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Dashboard (home)
│   └── globals.css                  # Global styles
├── components/
│   ├── features/                    # Feature-specific components
│   │   ├── admin/                  # Admin UI components
│   │   ├── documents/              # Document components
│   │   ├── folders/                # Folder components
│   │   ├── requirements/           # Requirement components
│   │   └── search/                 # Search components
│   ├── layout/                      # Layout components
│   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   ├── Topbar.tsx              # Top bar
│   │   └── ClipboardBar.tsx        # Clipboard indicator
│   └── ui/                          # Reusable UI components
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Input.tsx
│       └── ...
├── lib/
│   ├── services/                    # Business logic layer
│   │   ├── userService.ts          # User operations
│   │   ├── documentService.ts      # Document operations
│   │   ├── folderService.ts        # Folder operations
│   │   ├── departmentService.ts    # Department operations
│   │   ├── requirementService.ts   # Requirement operations
│   │   ├── commentService.ts       # Comment operations
│   │   ├── aclService.ts           # ACL management
│   │   ├── clipboardService.ts     # Clipboard paste logic
│   │   ├── searchService.ts        # Basic search
│   │   ├── searchServiceAdvanced.ts # Full-text search
│   │   ├── auditLogService.ts      # Audit logging
│   │   ├── uploadService.ts        # Upload URL generation
│   │   ├── dashboardService.ts     # Dashboard stats
│   │   ├── thumbnailService.ts     # Thumbnail generation
│   │   └── twoFactorAuthService.ts # 2FA (partial)
│   ├── repositories/                # Data access layer
│   │   ├── userRepository.ts
│   │   ├── documentRepository.ts
│   │   ├── folderRepository.ts
│   │   ├── departmentRepository.ts
│   │   ├── requirementRepository.ts
│   │   ├── commentRepository.ts
│   │   ├── auditLogRepository.ts
│   │   └── dashboardRepository.ts
│   ├── helpers/
│   │   ├── userContext.ts          # Get user departments
│   │   └── htmlSanitizer.ts        # DOMPurify sanitization
│   ├── storage/
│   │   └── s3Service.ts            # Signed URL generation
│   ├── utils/
│   │   └── api-response.ts         # Standardized API responses
│   ├── constants/
│   │   ├── config.ts               # App constants
│   │   └── schemas.ts              # Shared schemas
│   ├── permissions.ts               # Permission check functions
│   ├── validations.ts               # Zod validation schemas
│   ├── prisma.ts                    # Prisma client singleton
│   ├── rateLimit.ts                # Rate limiting logic
│   ├── env.ts                       # Environment variable validation
│   └── s3.ts                        # AWS S3 client configuration
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── generated/                   # Generated Prisma client
├── store/
│   └── clipboard.ts                 # Zustand clipboard store
├── hooks/
│   ├── useDebounce.ts              # Custom hooks
│   ├── useDocument.ts
│   ├── useFolder.ts
│   └── ...
├── types/
│   └── modules.d.ts                 # TypeScript declarations
├── docs/
│   └── 2FA_IMPLEMENTATION.md       # 2FA setup guide
├── auth.ts                          # NextAuth configuration
├── middleware.ts                    # Next.js middleware (auth)
├── next.config.js                   # Next.js config
├── tailwind.config.js              # Tailwind config
├── tsconfig.json                    # TypeScript config
├── prisma.config.ts                # Prisma config
├── seed.js                          # Database seeding script
├── package.json                     # Dependencies
├── .env.example                     # Example environment variables
└── README.md                        # This file
```

---

## Development

### Running Tests

```bash
# Unit tests (if implemented)
npm test

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Database Migrations

**Create migration:**
```bash
npx prisma migrate dev --name description_here
```

**Apply migrations (production):**
```bash
npx prisma migrate deploy
```

**Reset database (dev only):**
```bash
npx prisma migrate reset
```

**Prisma Studio (GUI):**
```bash
npx prisma studio
```

### Seeding Database

```bash
node seed.js
```

Creates:
- Admin user: `admin@docvault.com` / `admin123`
- Regular user: `user@docvault.com` / `user123`
- Sample departments, requirements, documents

---

## 📝 License

This project is part of an assessment. All rights reserved.

---

## Contributing

This is an assessment project. For production use, consider:
- Adding comprehensive test coverage (Jest, React Testing Library)
- Implementing real-time features with WebSockets
- Adding email notifications
- Completing 2FA frontend integration
- Adding document versioning
- Implementing folder permission inheritance
- Adding bulk operations UI
- Mobile app development

---

## Support

For questions or issues, please contact the repository owner or create an issue in the GitHub repository.

---

**Built with Next.js, TypeScript, PostgreSQL, and Supabase Storage**
