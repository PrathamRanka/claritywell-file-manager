'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  LogOut,
  LogIn,
  FileUp,
  Trash2,
  Copy,
  MessageSquare,
  Share2,
  RotateCcw,
} from 'lucide-react';

const actionIcons: Record<string, React.ReactNode> = {
  LOGIN: <LogIn className="w-4 h-4" />,
  LOGOUT: <LogOut className="w-4 h-4" />,
  CREATE: <FileUp className="w-4 h-4" />,
  EDIT: <FileUp className="w-4 h-4" />,
  DELETE: <Trash2 className="w-4 h-4" />,
  MOVE: <Copy className="w-4 h-4" />,
  COPY: <Copy className="w-4 h-4" />,
  COMMENT: <MessageSquare className="w-4 h-4" />,
  SHARE: <Share2 className="w-4 h-4" />,
  RESTORE: <RotateCcw className="w-4 h-4" />,
  UPLOAD: <FileUp className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  CREATE: 'bg-green-100 text-green-800',
  EDIT: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  MOVE: 'bg-yellow-100 text-yellow-800',
  COPY: 'bg-purple-100 text-purple-800',
  COMMENT: 'bg-indigo-100 text-indigo-800',
  SHARE: 'bg-pink-100 text-pink-800',
  RESTORE: 'bg-green-100 text-green-800',
  UPLOAD: 'bg-orange-100 text-orange-800',
};

export function AuditLogsTab() {
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { logs, total, pages, isLoading, page: currentPage } = useAuditLogs({
    action: filterAction || undefined,
    page,
    limit: 20,
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Action', 'User', 'Document ID', 'Folder ID', 'Timestamp', 'Metadata'];
    const csvContent = [
      headers.join(','),
      ...logs.map((log) =>
        [
          log.id,
          log.action,
          log.user?.name || 'Unknown',
          log.documentId || '-',
          log.folderId || '-',
          format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
          JSON.stringify(log.metadata || {}),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
    link.click();
  };

  const actions = [
    'LOGIN',
    'LOGOUT',
    'CREATE',
    'EDIT',
    'DELETE',
    'MOVE',
    'COPY',
    'COMMENT',
    'SHARE',
    'RESTORE',
    'UPLOAD',
  ];

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Audit Log ({total} total)</h2>
          <Button onClick={handleExportCSV} variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
        </div>

        {/* Action Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium block mb-2 text-muted-foreground">
              Filter by Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No audit logs found</p>
        </div>
      ) : (
        <>
          {/* Logs Table */}
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Document</th>
                  <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {actionIcons[log.action]}
                        <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}>
                          {log.action}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">{log.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {log.documentId ? log.documentId.slice(0, 8) + '...' : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.metadata ? (
                        <details className="cursor-pointer">
                          <summary className="text-accent hover:underline">View</summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-xs max-h-32">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {pages}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                variant="outline"
                size="sm"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
