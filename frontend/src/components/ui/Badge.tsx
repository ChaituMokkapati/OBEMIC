import React from 'react';
import { ReportStatus } from '@/types/faculty';

interface BadgeProps {
  status: ReportStatus | string;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'APPROVED':
      case 'PUBLISHED':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          color: '#34d399',
          dot: '#10b981'
        };
      case 'SUBMITTED':
      case 'REVIEWED':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          color: '#60a5fa',
          dot: '#3b82f6'
        };
      case 'GENERATED':
        return {
          bg: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          color: '#a78bfa',
          dot: '#8b5cf6'
        };
      case 'REJECTED':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#f87171',
          dot: '#ef4444'
        };
      case 'DRAFT':
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.15)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          color: '#cbd5e1',
          dot: '#94a3b8'
        };
    }
  };

  const style = getStatusStyles();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        backgroundColor: style.bg,
        border: style.border,
        color: style.color,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: style.dot,
          boxShadow: `0 0 6px ${style.dot}`,
        }}
      />
      {status}
    </span>
  );
};
