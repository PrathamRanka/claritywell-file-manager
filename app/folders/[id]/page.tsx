'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useClipboardStore } from '@/store/clipboard';
import { useFolder, useFolderItems } from '@/hooks/useFolder';
import { useContextMenu } from '@/hooks/useContextMenu';
import { usePagination } from '@/hooks/usePagination';
import { LoadingSpinner } from '@/components/ui';
import { Breadcrumbs } from '@/components/features/folders/Breadcrumbs';
import { DocumentGrid } from '@/components/features/documents/DocumentGrid';
import { UploadManager } from '@/components/features/folders/UploadManager';
import { ContextMenu } from '@/components/features/folders/ContextMenu';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'failed';
  abortController: AbortController;
}

export default function FolderPage({ params }: { params: { id: string } }) {
  const folderId = params.id;
  const {  page, pageSize } = usePagination();
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());

  const { folder, isLoading: folderLoading } = useFolder(folderId);
  const { items: documentItems, total, mutate } = useFolderItems(folderId, page, pageSize);
  const { copy, cut } = useClipboardStore();
  const contextMenu = useContextMenu<string>();

  // Build breadcrumb trail
  const breadcrumbs = [];
  if (folder) {
    let current = folder;
    while (current) {
      breadcrumbs.unshift(current);
      current = current.parent;
    }
  }

  const handleContextMenu = (e: React.MouseEvent, documentId: string) => {
    contextMenu.open(e, documentId);
  };

  const handleCopy = () => {
    const docu = documentItems.find((d: any) => d.id === contextMenu.data);
    if (docu) {
      copy([{ id: docu.id, title: docu.title }]);
      toast.success('Copied to clipboard');
    }
    contextMenu.close();
  };

  const handleCut = () => {
    const docu = documentItems.find((d: any) => d.id === contextMenu.data);
    if (docu) {
      cut([{ id: docu.id, title: docu.title }]);
      toast.info('Cut to clipboard');
    }
    contextMenu.close();
  };

  const handleDelete = async () => {
    const documentId = contextMenu.data;
    contextMenu.close();

    if (!documentId) return;

    // Optimistic update
    mutate(
      {
        items: documentItems.filter((d: any) => d.id !== documentId),
        total: Math.max(total - 1, 0),
      },
      false
    );

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
          toast.success(`${file.name} uploaded`);
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

  const handleCancelUpload = (uploadId: string) => {
    const upload = uploads.get(uploadId);
    if (upload) {
      upload.abortController.abort();
      const newUploads = new Map(uploads);
      newUploads.delete(uploadId);
      setUploads(newUploads);
      toast.info('Upload cancelled');
    }
  };

  if (folderLoading) {
    return <LoadingSpinner message="Loading folder..." />;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <Breadcrumbs folders={breadcrumbs} />

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">{folder?.name || 'Folder'}</h1>
        <UploadManager 
          uploads={uploads}
          onUpload={handleUpload}
          onCancel={handleCancelUpload}
        />
      </div>

      {/* Documents */}
      <DocumentGrid
        documents={documentItems}
        onContextMenu={handleContextMenu}
      />

      {/* Context menu */}
      {contextMenu.isOpen && contextMenu.position && (
        <ContextMenu
          x={contextMenu.position.x}
          y={contextMenu.position.y}
          onCopy={handleCopy}
          onCut={handleCut}
          onDelete={handleDelete}
          onClose={contextMenu.close}
        />
      )}
    </div>
  );
}
