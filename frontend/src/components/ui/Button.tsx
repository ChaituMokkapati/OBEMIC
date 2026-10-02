import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  icon,
  style,
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
          border: 'none'
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
          border: 'none'
        };
      case 'secondary':
        return {
          background: 'rgba(255, 255, 255, 0.08)',
          color: '#f8fafc',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: 'none'
        };
      case 'ghost':
        return {
          background: 'transparent',
          color: '#94a3b8',
          border: 'none',
          boxShadow: 'none'
        };
      case 'primary':
      default:
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
          border: 'none'
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        ...variantStyle,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 20px',
        borderRadius: '10px',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        outline: 'none',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isLoading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.filter = 'none';
        }
      }}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: '#ffffff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
      ) : (
        icon
      )}
      {children}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};
