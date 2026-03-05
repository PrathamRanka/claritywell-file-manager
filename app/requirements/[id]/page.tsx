'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Building2, Flag, User, FileText, Plus, 
  Clock, CheckCircle, Circle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Requirement {
  id: string;
  clientName: string;
  dueDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  department: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
  };
}

interface Document {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
  };
}

export default function RequirementPage({ params }: { params: { id: string } }) {
  const requirementId = params.id;
  const router = useRouter();

  const { data: requirement } = useSWR<Requirement>(
    `/api/requirements/${requirementId}`,
    fetcher
  );
  const { data: documents } = useSWR<Document[]>(
    `/api/documents?requirementId=${requirementId}`,
    fetcher
  );

  const handleCreateDocument = async () => {
    try {
      const res = await fetch('/api/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${requirement?.clientName} - New Document`,
          type: 'WYSIWYG',
          visibility: 'DEPARTMENT',
          requirementId,
        }),
      });

      if (!res.ok) throw new Error();
      
      const newDoc = await res.json();
      toast.success('Document created');
      router.push(`/documents/${newDoc.id}`);
    } catch {
      toast.error('Failed to create document');
    }
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      LOW: {
        color: 'bg-priority-low/10 text-priority-low border-priority-low/20',
        icon: <Flag className="w-4 h-4" />,
      },
      MEDIUM: {
        color: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20',
        icon: <Flag className="w-4 h-4" />,
      },
      HIGH: {
        color: 'bg-priority-high/10 text-priority-high border-priority-high/20',
        icon: <Flag className="w-4 h-4" />,
      },
      URGENT: {
        color: 'bg-priority-urgent/10 text-priority-urgent border-priority-urgent/20',
        icon: <Flag className="w-4 h-4" />,
      },
    };
    return configs[priority as keyof typeof configs] || configs.LOW;
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: {
        color: 'text-muted-foreground',
        icon: <Circle className="w-4 h-4" />,
        label: 'Pending',
      },
      IN_PROGRESS: {
        color: 'text-blue-500',
        icon: <Clock className="w-4 h-4" />,
        label: 'In Progress',
      },
      COMPLETED: {
        color: 'text-success',
        icon: <CheckCircle className="w-4 h-4" />,
        label: 'Completed',
      },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  if (!requirement) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading requirement...</p>
        </div>
      </div>
    );
  }

  const priorityConfig = getPriorityConfig(requirement.priority);
  const statusConfig = getStatusConfig(requirement.status);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">{requirement.clientName}</h1>
            <p className="text-muted-foreground">Client requirement details and documents</p>
          </div>
          
          <button
            onClick={handleCreateDocument}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors focus-ring"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Due Date</p>
              <p className="font-medium">{format(new Date(requirement.dueDate), 'MMM d, yyyy')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(requirement.dueDate), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Department</p>
              <p className="font-medium">{requirement.department.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${priorityConfig.color}`}>
              {priorityConfig.icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Priority</p>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${priorityConfig.color}`}>
                {requirement.priority}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${statusConfig.color}`}>
              {statusConfig.icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <p className={`font-medium ${statusConfig.color}`}>{statusConfig.label}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>Created by <span className="font-medium text-foreground">{requirement.createdBy.name}</span></span>
          <span className="mx-2">•</span>
          <span>{formatDistanceToNow(new Date(requirement.createdAt), { addSuffix: true })}</span>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-xl font-bold">Related Documents</h2>
        </div>

        <div className="p-6">
          {!documents && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 shimmer rounded-lg" />
              ))}
            </div>
          )}

          {documents && documents.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-1">No documents yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a document to start working on this requirement
              </p>
              <button
                onClick={handleCreateDocument}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent-hover transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create Document</span>
              </button>
            </div>
          )}

          {documents && documents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc, index) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="block bg-muted/50 border border-border rounded-lg p-4 hover:border-accent hover:shadow-md transition-all card-lift stagger-item"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-file-wysiwyg/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5" style={{ color: 'rgb(var(--file-wysiwyg))' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate mb-1">{doc.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {doc.owner.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
