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

    for (const file of Array.from(files)) {
      const uploadId = `${Date.now()}-${file.name}`;
      const abortController = new AbortController();

      newUploads.set(uploadId, {
        file,
        progress: 0,
        status: 'uploading',
        abortController,
      });
      setUploads(new Map(newUploads));

      try {
        // Step 1: Request signed upload URL
        const requestRes = await fetch('/api/uploads/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            size: file.size,
          }),
          signal: abortController.signal,
        });

        if (!requestRes.ok) throw new Error('Failed to request upload');

        const { data: uploadData } = await requestRes.json();

        // Step 2: Upload file to S3 using signed URL
        const uploadRes = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
          signal: abortController.signal,
        });

        if (!uploadRes.ok) {
          throw new Error('Failed to upload file to storage');
        }

        // Update progress to 90% after upload
        newUploads.set(uploadId, {
          ...newUploads.get(uploadId)!,
          progress: 90,
        });
        setUploads(new Map(newUploads));

        // Step 3: Create document in database (already links to folder)
        const createRes = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name,
            type: file.type.startsWith('image/') ? 'IMAGE' : 'PDF',
            visibility: 'PRIVATE',
            storagePath: uploadData.fileKey,
            mimeType: file.type,
            folderId,
          }),
          signal: abortController.signal,
        });

        if (!createRes.ok) throw new Error('Failed to create document');

        newUploads.set(uploadId, {
          ...newUploads.get(uploadId)!,
          progress: 100,
          status: 'done',
        });
        setUploads(new Map(newUploads));
        toast.success(`${file.name} uploaded`);

        // Refresh the folder items
        mutate();
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          newUploads.set(uploadId, {
            ...newUploads.get(uploadId)!,
            status: 'failed',
          });
          setUploads(new Map(newUploads));
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    }
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
