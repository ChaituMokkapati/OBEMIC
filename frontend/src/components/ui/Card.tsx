import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, glow = false, style, ...props }) => {
  return (
    <div
      style={{
        background: 'rgba(30, 41, 59, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: glow 
          ? '0 8px 32px rgba(59, 130, 246, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4)' 
          : '0 8px 32px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};
