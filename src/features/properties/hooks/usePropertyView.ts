import { useState } from 'react';

export function usePropertyView() {
  const [view, setView] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem('property_management_view');
    return (saved === 'grid' || saved === 'list') ? saved : 'list';
  });

  const changeView = (newView: 'list' | 'grid') => {
    setView(newView);
    localStorage.setItem('property_management_view', newView);
  };

  return { view, setView: changeView };
}
