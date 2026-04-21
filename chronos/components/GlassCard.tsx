import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  customBg?: string;
  customBorderColor?: string;
}

/**
 * GlassCard component with glass morphism effect
 * Used for creating card containers with backdrop blur and customizable styling
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = "",
  style = {},
  onClick,
  customBg,
  customBorderColor
}) => {
  const borderStyle = customBorderColor 
    ? { borderLeft: `6px solid ${customBorderColor}` } 
    : {};
  
  return (
    <div 
      onClick={onClick}
      className={`backdrop-blur-2xl rounded-[2rem] p-5 border border-white/5 shadow-2xl transition-all ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      } ${className}`}
      style={{ 
        backgroundColor: customBg || 'rgba(15, 23, 42, 0.6)', 
        ...style, 
        ...borderStyle 
      }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
