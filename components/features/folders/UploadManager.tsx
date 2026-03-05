'use client';

import { useRef, useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatFileSize } from '@/lib/utils/formatters';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'failed';
  abortController: AbortController;
}

interface UploadManagerProps {
  uploads: Map<string, UploadProgress>;
  onUpload: (files: FileList) => void;
  onCancel: (uploadId: string) => void;
}

export function UploadManager({ uploads, onUpload, onCancel }: UploadManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      
      <Button onClick={handleClick} icon={Upload}>
        Upload Files
      </Button>

      {/* Upload progress list */}
      {uploads.size > 0 && (
        <div className="mt-4 space-y-2">
          {Array.from(uploads.entries()).map(([id, upload]) => (
            <div
              key={id}
              className="bg-surface border border-border rounded-lg p-4 flex items-center gap-3"
            >
              {upload.status === 'uploading' && (
                <Loader2 className="w-5 h-5 text-accent animate-spin flex-shrink-0" />
              )}
              {upload.status === 'done' && (
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
              )}
              {upload.status === 'failed' && (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(upload.file.size)}
                </p>
                {upload.status === 'uploading' && (
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {upload.status === 'uploading' && (
                <button
                  onClick={() => onCancel(id)}
                  className="p-1 hover:bg-muted rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
