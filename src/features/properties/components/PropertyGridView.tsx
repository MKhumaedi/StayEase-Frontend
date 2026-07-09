import React from 'react';
import { Property, PropertyCategory } from '../../../types';
import { PropertyCard } from './PropertyCard';

interface PropertyGridViewProps {
  properties: any[];
  categories: PropertyCategory[];
  onView: (p: any) => void;
  onEdit: (p: any) => void;
  onDelete: (p: any) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
  onDeleteDraft?: (id: string) => void;
  onContinueDraft?: (draft: any) => void;
}

export function PropertyGridView({
  properties,
  categories,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onDeleteDraft,
  onContinueDraft
}: PropertyGridViewProps) {
  return (
    <div 
      id="properties-grid-view"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      {properties.map(p => {
        const cat = categories.find(c => c.id === p.categoryId);
        return (
          <div key={p.id} className="h-full">
            <PropertyCard
              property={p}
              categoryName={cat?.name}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              onDeleteDraft={onDeleteDraft}
              onContinueDraft={onContinueDraft}
            />
          </div>
        );
      })}
    </div>
  );
}
