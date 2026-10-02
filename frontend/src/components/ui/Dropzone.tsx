'use client';

import React, { useState, useRef } from 'react';

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  accept?: string;
  title?: string;
  subtitle?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
  accept = '.xlsx, .xls',
  title = 'Drag & Drop your marks Excel template here',
  subtitle = 'Supports Microsoft Excel (.xlsx, .xls)'
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        onFileSelect(file);
      } else {
        alert('Please upload a valid Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={accept}
        style={{ display: 'none' }}
      />

      {!selectedFile ? (
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragOver ? '2px dashed #3b82f6' : '2px dashed rgba(255, 255, 255, 0.2)',
            backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.08)' : 'rgba(15, 23, 42, 0.4)',
            borderRadius: '16px',
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
              fontSize: '1.5rem',
              marginBottom: '4px'
            }}
          >
            📊
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginBottom: '4px' }}>{title}</h4>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{subtitle}</p>
          </div>
          <button
            type="button"
            style={{
              marginTop: '8px',
              padding: '6px 14px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#93c5fd',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Browse Files
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                color: '#34d399'
              }}
            >
              📄
            </div>
            <div>
              <p style={{ fontWeight: '600', color: '#f8fafc', fontSize: '0.95rem' }}>
                {selectedFile.name}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};
