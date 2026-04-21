import React from 'react';

interface IconButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  active?: boolean;
  color?: string;
}

/**
 * IconButton component for action buttons with icons
 * Supports active state with custom color highlighting
 */
export const IconButton: React.FC<IconButtonProps> = ({ 
  icon: Icon, 
  onClick, 
  active, 
  color 
}) => (
  <button 
    type="button"
    onClick={onClick}
    className={`p-4 rounded-[1.2rem] transition-all active:scale-90 ${
      active ? 'text-white shadow-xl' : 'text-slate-400 dark:text-slate-600'
    }`}
    style={
      active && color 
        ? { 
            backgroundColor: color, 
            boxShadow: `0 10px 25px -5px ${color}66` 
          } 
        : {}
    }
  >
    <Icon className="w-6 h-6" />
  </button>
);

export default IconButton;
