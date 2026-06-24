import React from 'react';
import { Property, PropertyCategory } from '../../../types';
import { PropertyCard } from './PropertyCard';

interface PropertyGridViewProps {
  properties: Property[];
  categories: PropertyCategory[];
  onView: (p: Property) => void;
  onEdit: (p: Property) => void;
  onDelete: (p: Property) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
}

export function PropertyGridView({
  properties,
  categories,
  onView,
  onEdit,
  onDelete,
  onToggleStatus
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
            />
          </div>
        );
      })}
    </div>
  );
}
