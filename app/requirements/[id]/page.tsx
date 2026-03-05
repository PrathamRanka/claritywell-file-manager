'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useRequirement } from '@/hooks/useRequirement';
import { useDocuments } from '@/hooks/useDocument';
import { LoadingSpinner, EmptyState } from '@/components/ui';
import { DocumentGrid } from '@/components/features/documents/DocumentGrid';
import { RequirementHeader } from '@/components/features/requirements/RequirementHeader';
import { FileText } from 'lucide-react';

export default function RequirementPage({ params }: { params: { id: string } }) {
  const requirementId = params.id;
  const router = useRouter();

  const { requirement, isLoading: requirementLoading } = useRequirement(requirementId);
  const { documents, isLoading: documentsLoading } = useDocuments({ requirementId });

  const handleCreateDocument = async () => {
    if (!requirement) return;

    try {
      const res = await fetch('/api/documents/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${requirement.clientName} - New Document`,
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

  if (requirementLoading) {
    return <LoadingSpinner message="Loading requirement..." />;
  }

  if (!requirement) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <EmptyState
          icon={FileText}
          title="Requirement not found"
          description="The requirement you're looking for doesn't exist or you don't have access to it."
        />
      </div>
    );
  }

  const documentItems = Array.isArray(documents.items) ? documents.items : [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <RequirementHeader 
        requirement={requirement}
        onCreateDocument={handleCreateDocument}
      />

      {/* Documents section */}
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-accent" />
          Documents
        </h2>
        <DocumentGrid 
          documents={documentItems}
          isLoading={documentsLoading}
        />
      </div>
    </div>
  );
}
