import React, { useState, useEffect, useRef } from 'react';
import { NominatimService } from '../services/NominatimService';
import { AutocompleteSuggestion } from '../types';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface OsmAutocompleteProps {
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  placeholder?: string;
  className?: string;
}

export function OsmAutocomplete({
  onSelect,
  placeholder = 'Search address or destination...',
  className = ''
}: OsmAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await NominatimService.searchAddress(trimmed);
        setSuggestions(results);
        setOpen(results.length > 0);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce to respect OpenStreetMap Nominatim request rate policies

    return () => clearTimeout(handler);
  }, [query]);

  // Handle outside clicks to close the popover list
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: AutocompleteSuggestion) => {
    setQuery(item.displayName);
    setSuggestions([]);
    setOpen(false);
    onSelect(item);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-200 pl-10 pr-10 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600 focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 shadow-xl rounded-xl max-h-56 overflow-y-auto z-50 py-1 font-sans">
          {suggestions.map((item, idx) => (
            <button
              key={`${item.placeId}-${idx}`}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left text-[11px] text-slate-700 hover:bg-indigo-50/40 border-b border-slate-50 last:border-0 transition-colors font-semibold"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <span className="truncate leading-relaxed">{item.displayName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export {};
