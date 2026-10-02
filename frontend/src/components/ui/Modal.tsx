import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '12px'
          }}
        >
          <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
