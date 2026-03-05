# DocVault - Frontend Implementation

A modern, production-grade document management system built with Next.js 14 App Router, featuring a distinctive design system and comprehensive UI/UX.

## 🎨 Design Principles

This frontend implementation follows carefully crafted design principles:

- **Typography**: Custom font pairing with DM Sans (body) and Sora (display/headings)
- **Color System**: Deep indigo accent color (#E04CE6) - distinctive and professional
- **Motion**: Purposeful animations including staggered list reveals, hover lifts, and smooth transitions
- **Spatial Composition**: Clean hierarchy with intentional asymmetry in dashboard layouts
- **Premium Feel**: Elevated cards, backdrop blur effects, and refined interactions throughout

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: Zustand (clipboard store)
- **Data Fetching**: SWR with optimistic updates
- **Forms**: React Hook Form + Zod validation
- **Editor**: TipTap (rich text editing)
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **Authentication**: NextAuth.js

### Project Structure

```
app/
├── layout.tsx              # Root layout with auth check
├── layout-content.tsx      # Client-side layout wrapper
├── globals.css            # CSS variables and design system
├── page.tsx               # Dashboard (role-based views)
├── login/page.tsx         # Authentication page
├── folders/[id]/page.tsx  # Folder view with documents
├── documents/[id]/page.tsx # Document editor with comments
├── requirements/[id]/page.tsx # Requirement details
├── admin/page.tsx         # Admin panel with tabs
├── search/page.tsx        # Search interface
├── error.tsx              # Error boundary
├── not-found.tsx          # 404 page
└── loading.tsx            # Loading state

components/
└── layout/
    ├── Sidebar.tsx        # Collapsible sidebar with folder tree
    ├── Topbar.tsx         # Search + user menu
    └── ClipboardBar.tsx   # Floating clipboard indicator

store/
└── clipboard.ts           # Zustand store for copy/cut/paste

hooks/
└── useDebounce.ts         # Debounce hook for search
```

## 🎯 Features Implemented

### 1. Authentication (`/login`)
- Visually striking centered card layout
- Email/password form with NextAuth integration
- Form validation with Zod
- Error toasts on failure
- Auto-redirect on success

### 2. Dashboard (`/`)
- **Admin View**: Stats cards, recent activity feed, quick links
- **User View**: Recent documents grid, department requirements list
- Role-based rendering
- Staggered animations on load
- Real-time activity updates

### 3. Folder View (`/folders/[id]`)
- Breadcrumb navigation
- Document grid with cards
- Context menu (right-click): Copy, Cut, Rename, Delete
- Upload UI with progress bars per file
- Cancel upload functionality (AbortController)
- Clipboard integration (copy/cut/paste)
- Pagination with "Load More"
- Skeleton loaders
- Empty states

### 4. Document Editor (`/documents/[id]`)
- Two-column layout (editor + comments sidebar)
- TipTap rich text editor
- Custom toolbar (Bold, Italic, Headings, Lists)
- Permission-based editing (canEdit)
- Auto-save with status indicator
- Threaded comments with inline replies
- Share modal (ACL management)
- Download button for PDF/images
- Document metadata display

### 5. Requirements (`/requirements/[id]`)
- Requirement metadata header
- Priority badges (color-coded)
- Status indicators
- Related documents grid
- "New Document" creation
- Empty states

### 6. Admin Panel (`/admin`)
- **Users Tab**: 
  - Table with name, email, role, departments
  - Create user slide-over panel
  - Delete functionality
- **Departments Tab**:
  - Expandable department cards
  - Member lists
  - Add/remove members
- **Requirements Tab**:
  - Table with client, due date, priority, status
  - Create requirement form
  - Edit/delete actions

### 7. Search (`/search`)
- Debounced search input (300ms)
- URL param updates
- Grouped results (Documents + Comments)
- Query term highlighting with `<mark>`
- Staggered fade-in animations
- Empty states
- Result counts

## 🎨 Design System

### Color Variables (CSS)

```css
/* Primary Colors */
--accent: 224 76 230           /* Deep indigo */
--accent-hover: 219 66 220
--background: 250 250 252       /* Light neutral */
--surface: 255 255 255          /* Card backgrounds */

/* Visibility Badges */
--visibility-private: gray
--visibility-department: blue
--visibility-shared: emerald

/* Priority Colors */
--priority-low: gray
--priority-medium: blue
--priority-high: orange
--priority-urgent: red

/* File Type Accents */
--file-pdf: red
--file-image: amber
--file-wysiwyg: violet
```

### Typography Scale

- **Display**: Sora (headings, large titles)
- **Body**: DM Sans (paragraphs, UI text)
- Google Fonts integration via `@import`

### Motion Patterns

```css
/* Fade in with upward slide */
.fade-in { animation: fadeIn 0.3s ease-out; }

/* Staggered list animations */
.stagger-item:nth-child(n) { animation-delay: n * 50ms; }

/* Card hover lift */
.card-lift:hover { transform: translateY(-2px); }

/* Shimmer loading */
.shimmer { animation: shimmer 1.5s infinite; }
```

## 🔧 Key Implementation Details

### 1. Responsive Layout
- Sidebar: 240px desktop → hamburger drawer mobile (<768px)
- Document grid: 3-col → 2-col → 1-col
- Tables: horizontal scroll on mobile
- Search: full input desktop → icon-only mobile

### 2. Clipboard System (Zustand)
```typescript
{
  items: ClipboardItem[],
  action: 'copy' | 'cut' | null,
  copy(), cut(), clear(), getCount()
}
```
- Floating bar at bottom center
- Shows item count
- Paste button context-aware
- Animated slide-up/slide-down

### 3. Context Menu
- Right-click on document cards
- Positioned at cursor
- Options: Copy, Cut, Rename, Delete
- Keyboard accessible (Escape to close)

### 4. Upload Progress UI
- Per-file progress bars (0-100%)
- Status indicators: uploading / done / failed
- Cancel button with AbortController
- Inline in folder view
- Refresh document list on completion

### 5. Optimistic Updates
- Delete document: immediate removal from UI
- Restore on server error with toast
- SWR revalidation

### 6. Accessibility
- All interactive elements have `aria-label`
- Keyboard navigation (Arrow keys, Enter, Space)
- Focus rings visible (`.focus-ring` utility)
- WCAG AA color contrast
- Modal focus trapping

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
npm start
```

## 🌐 API Integration

All pages use SWR for data fetching with these patterns:

```typescript
// Basic fetch
const { data, error, mutate } = useSWR('/api/endpoint', fetcher);

// With pagination
const { data } = useSWR(`/api/items?page=${page}&pageSize=12`, fetcher);

// Optimistic updates
mutate(optimisticData, false);
try {
  await apiCall();
  mutate();
} catch {
  mutate(); // Revert
}
```

### Expected API Endpoints

- `GET /api/folders` - List all folders
- `GET /api/folders/[id]` - Get folder details
- `GET /api/folders/[id]/items` - List folder documents
- `GET /api/documents/[id]` - Get document
- `PATCH /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]` - Delete document
- `POST /api/documents/[id]/comment` - Add comment
- `GET /api/documents/[id]/comment` - List comments
- `POST /api/documents/[id]/acl` - Share document
- `GET /api/requirements` - List requirements
- `GET /api/requirements/[id]` - Get requirement
- `POST /api/requirements` - Create requirement
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `DELETE /api/users/[id]` - Delete user
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `GET /api/search?q=...` - Search documents and comments
- `GET /api/audit-log` - Get audit log entries
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🎯 Next Steps

### Phase 5: S3 Upload Integration
Wire the upload UI to signed URL API:
```typescript
1. POST /api/uploads/request → { uploadUrl, key }
2. PUT uploadUrl (S3) with file
3. POST /api/documents/create with key
```

### Additional Enhancements
- [ ] Infinite scroll for documents (IntersectionObserver)
- [ ] Drag-and-drop file upload
- [ ] Document preview in modal
- [ ] Advanced search filters
- [ ] Export/import functionality
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts (⌘K for search)
- [ ] Real-time collaboration (WebSockets)

## 📝 Notes

- All forms use react-hook-form with Zod validation
- Toast notifications via Sonner for all mutations
- Error boundaries at route segments
- Suspense boundaries for loading states
- Mobile-first responsive design
- TypeScript throughout
- ESLint + Prettier ready

## 🎨 Design Inspiration

This implementation draws inspiration from:
- Modern SaaS dashboards (Linear, Notion)
- Editorial layouts (Medium, Substack)
- Premium design systems (Radix UI, shadcn/ui)

But with a distinctive visual identity:
- Unique color palette (deep indigo accent)
- Custom font pairing (DM Sans + Sora)
- Purposeful motion design
- Elevated component treatments

---

Built with attention to detail and a commitment to exceptional user experience.
