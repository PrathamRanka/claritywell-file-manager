'use client';

import { useState, useRef, useCallback } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, FolderPlus, Upload, FileText, Image as ImageIcon, 
  FileType, MoreVertical, Copy, Scissors, Trash2, Edit3, X,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useClipboardStore } from '@/store/clipboard';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Document {
  id: string;
  title: string;
  type: string;
  visibility: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
  };
  thumbnailUrl?: string;
}

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  parent?: Folder;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'failed';
  abortController: AbortController;
}

interface FolderPageProps {
  params: { id: string };
}

export default function FolderPage({ params }: FolderPageProps) {
  const folderId = params.id;
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; documentId: string } | null>(null);
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data: folder } = useSWR<Folder>(`/api/folders/${folderId}`, fetcher);
  const { data: documents, mutate } = useSWR<{ items: Document[]; total: number }>(
    `/api/folders/${folderId}/items?page=${page}&pageSize=${pageSize}`,
    fetcher
  );
  
  const { copy, cut, items: clipboardItems, getCount } = useClipboardStore();

  // Build breadcrumb trail
  const breadcrumbs: Folder[] = [];
  if (folder) {
    let current: Folder | undefined = folder;
    while (current) {
      breadcrumbs.unshift(current);
      current = current.parent;
    }
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, documentId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, documentId });
  }, []);

  const handleCopy = (doc: Document) => {
    copy([{ id: doc.id, title: doc.title }]);
    toast.success('Copied to clipboard');
    setContextMenu(null);
  };

  const handleCut = (doc: Document) => {
    cut([{ id: doc.id, title: doc.title }]);
    toast.info('Cut to clipboard');
    setContextMenu(null);
  };

  const handleDelete = async (documentId: string) => {
    setContextMenu(null);
    
    // Optimistic update
    if (documents) {
      mutate(
        {
          ...documents,
          items: documents.items.filter((d) => d.id !== documentId),
          total: documents.total - 1,
        },
        false
      );
    }

    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      
      toast.success('Document deleted');
      mutate();
    } catch (error) {
      toast.error('Failed to delete document');
      mutate();
    }
  };

  const handleUpload = async (files: FileList) => {
    const newUploads = new Map(uploads);

    Array.from(files).forEach((file) => {
      const uploadId = `${Date.now()}-${file.name}`;
      const abortController = new AbortController();
      
      newUploads.set(uploadId, {
        file,
        progress: 0,
        status: 'uploading',
        abortController,
      });

      // Simulate upload progress (in real app, wire to signed URL upload)
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          newUploads.set(uploadId, {
            ...newUploads.get(uploadId)!,
            progress: 100,
            status: 'done',
          });
          setUploads(new Map(newUploads));
          
          // Refresh documents list
          setTimeout(() => {
            mutate();
            newUploads.delete(uploadId);
            setUploads(new Map(newUploads));
          }, 1000);
        } else {
          newUploads.set(uploadId, {
            ...newUploads.get(uploadId)!,
            progress,
          });
          setUploads(new Map(newUploads));
        }
      }, 500);
    });

    setUploads(newUploads);
  };

  const cancelUpload = (uploadId: string) => {
    const upload = uploads.get(uploadId);
    if (upload) {
      upload.abortController.abort();
      const newUploads = new Map(uploads);
      newUploads.delete(uploadId);
      setUploads(newUploads);
      toast.info('Upload cancelled');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileType className="w-5 h-5" style={{ color: 'rgb(var(--file-pdf))' }} />;
      case 'IMAGE':
        return <ImageIcon className="w-5 h-5" style={{ color: 'rgb(var(--file-image))' }} />;
      case 'WYSIWYG':
      default:
        return <FileText className="w-5 h-5" style={{ color: 'rgb(var(--file-wysiwyg))' }} />;
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    const badges = {
      PRIVATE: 'bg-visibility-private/10 text-visibility-private border-visibility-private/20',
      DEPARTMENT: 'bg-visibility-department/10 text-visibility-department border-visibility-department/20',
      SHARED: 'bg-visibility-shared/10 text-visibility-shared border-visibility-shared/20',
    };
    return badges[visibility as keyof typeof badges] || badges.PRIVATE;
  };

  return (
    <>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
          <Link href="/" className="text-muted-foreground hover:text-accent transition-colors">
            Home
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Link
                href={`/folders/${crumb.id}`}
                className={`transition-colors ${
                  i === breadcrumbs.length - 1
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-accent'
                }`}
              >
                {crumb.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h1 className="font-display text-3xl font-bold">{folder?.name || 'Folder'}</h1>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors focus-ring">
              <FolderPlus className="w-4 h-4" />
              <span className="hidden sm:inline">New Folder</span>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors focus-ring"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
            
            {getCount() > 0 && (
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent text-accent hover:bg-accent/10 transition-colors focus-ring">
                Paste ({getCount()})
              </button>
            )}
          </div>
        </div>

        {/* Upload progress */}
        {uploads.size > 0 && (
          <div className="mb-6 space-y-2 bg-surface border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Uploading files</h3>
            {Array.from(uploads.entries()).map(([id, upload]) => (
              <div key={id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm truncate">{upload.file.name}</span>
                    <span className="text-xs text-muted-foreground">{Math.round(upload.progress)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
                
                {upload.status === 'uploading' && (
                  <button
                    onClick={() => cancelUpload(id)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                    aria-label="Cancel upload"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {upload.status === 'done' && (
                  <CheckCircle className="w-4 h-4 text-success" />
                )}
                {upload.status === 'failed' && (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Document grid */}
        {!documents && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 shimmer rounded-lg" />
            ))}
          </div>
        )}

        {documents && documents.items.length === 0 && uploads.size === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-1">No documents yet</p>
            <p className="text-sm">Upload files or create a new document</p>
          </div>
        )}

        {documents && documents.items.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.items.map((doc, index) => (
                <div
                  key={doc.id}
                  className="group relative bg-surface border border-border rounded-lg overflow-hidden card-lift stagger-item"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onContextMenu={(e) => handleContextMenu(e, doc.id)}
                >
                  <Link href={`/documents/${doc.id}`} className="block">
                    {/* Thumbnail/Icon */}
                    <div className="aspect-video bg-muted/50 flex items-center justify-center border-b border-border">
                      {doc.thumbnailUrl ? (
                        <img src={doc.thumbnailUrl} alt={doc.title} className="w-full h-full object-cover" />
                      ) : (
                        getFileIcon(doc.type)
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-medium truncate mb-2">{doc.title}</h3>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{doc.owner.name}</span>
                        <span>{formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}</span>
                      </div>
                      <div className="mt-3">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getVisibilityBadge(doc.visibility)}`}>
                          {doc.visibility}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* More menu button */}
                  <button
                    onClick={(e) => handleContextMenu(e, doc.id)}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-surface/80 backdrop-blur-sm border border-border opacity-0 group-hover:opacity-100 transition-opacity focus-ring"
                    aria-label="More options"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {documents.total > documents.items.length && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setPage(page + 1)}
                  className="px-6 py-2 rounded-lg border border-border hover:bg-muted transition-colors focus-ring"
                >
                  Load More
                </button>
                <p className="text-sm text-muted-foreground mt-3">
                  Showing {documents.items.length} of {documents.total} documents
                </p>
              </div>
            )}
          </>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-surface-raised border border-border rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => {
                const doc = documents?.items.find((d) => d.id === contextMenu.documentId);
                doc && handleCopy(doc);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-left text-sm"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            <button
              onClick={() => {
                const doc = documents?.items.find((d) => d.id === contextMenu.documentId);
                doc && handleCut(doc);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-left text-sm"
            >
              <Scissors className="w-4 h-4" />
              <span>Cut</span>
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-left text-sm"
            >
              <Edit3 className="w-4 h-4" />
              <span>Rename</span>
            </button>
            <div className="my-1 border-t border-border" />
            <button
              onClick={() => handleDelete(contextMenu.documentId)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-left text-sm text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
