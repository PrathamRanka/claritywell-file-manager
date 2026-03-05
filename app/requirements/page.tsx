'use client';

import { useRequirements } from '@/hooks/useRequirement';
import { LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import { FileText, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '@/components/features/requirements/StatusBadge';
import { PriorityBadge } from '@/components/features/requirements/PriorityBadge';

export default function RequirementsPage() {
  const { requirements, isLoading, isError } = useRequirements();

  if (isLoading) {
    return <LoadingSpinner message="Loading requirements..." />;
  }

  if (isError) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load requirements. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Requirements</h1>
        <p className="text-muted-foreground">
          View and manage all client requirements
        </p>
      </div>

      {/* Requirements List */}
      {!requirements || requirements.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No requirements found"
          description="Requirements will appear here once they are created"
        />
      ) : (
        <div className="space-y-4">
          {requirements.map((requirement: any) => (
            <Link
              key={requirement.id}
              href={`/requirements/${requirement.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left side - Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {requirement.clientName}
                    </h3>
                    <StatusBadge status={requirement.status} />
                    <PriorityBadge priority={requirement.priority} />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Due: {new Date(requirement.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {requirement.department && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Department:</span>
                        <span>{requirement.department.name}</span>
                      </div>
                    )}
                    
                    {requirement.createdBy && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Created by:</span>
                        <span>{requirement.createdBy.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side - Arrow icon */}
                <div className="flex-shrink-0">
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
