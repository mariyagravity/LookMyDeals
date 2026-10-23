import React from 'react';
import { LOCALITIES } from '../data/seedData';
import { MapPin } from 'lucide-react';

interface LocalitySelectorProps {
  selectedLocalityId: string;
  onSelectLocality: (localityId: string) => void;
}

export const LocalitySelector: React.FC<LocalitySelectorProps> = ({
  selectedLocalityId,
  onSelectLocality,
}) => {
  return (
    <div className="relative flex items-center">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-lg border border-surface-border shadow-sm text-sm focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <label htmlFor="locality-select" className="sr-only">
          Select Kochi Locality or PIN
        </label>
        <select
          id="locality-select"
          value={selectedLocalityId}
          onChange={(e) => onSelectLocality(e.target.value)}
          className="bg-transparent text-ink font-semibold text-sm focus:outline-none cursor-pointer pr-2"
        >
          {LOCALITIES.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} {loc.pinCode !== '682000' ? `(${loc.pinCode})` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
