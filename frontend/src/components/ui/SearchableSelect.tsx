'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'Select...' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', zIndex: isOpen ? 50 : 1 }}>
      <div 
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
        style={{
          padding: '10px 14px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid #334155',
          borderRadius: '6px',
          color: selectedOption ? '#f8fafc' : '#94a3b8',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span style={{ fontSize: '0.8rem' }}>▼</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '6px',
          zIndex: 50,
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          maxHeight: '250px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <input 
            autoFocus
            type="text" 
            placeholder="Search..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              margin: '8px',
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid #334155',
              borderRadius: '4px',
              color: 'white',
              outline: 'none'
            }}
          />
          <div style={{ overflowY: 'auto', paddingBottom: '8px' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '8px 12px', color: '#94a3b8', fontSize: '0.9rem' }}>No matches found</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    color: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    background: value === opt.value ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = value === opt.value ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
