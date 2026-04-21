import React from 'react';

interface InputFieldProps {
  label: string;
  id: string;
  placeholder?: string;
  defaultValue?: string;
  type?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
  textColor?: string;
}

/**
 * InputField component for form inputs
 * Standardized styling with customizable text color
 */
export const InputField: React.FC<InputFieldProps> = ({
  label,
  id,
  placeholder,
  defaultValue,
  type = "text",
  className = "",
  onChange,
  value,
  textColor
}) => (
  <div className={`space-y-1.5 ${className}`}>
    <label 
      htmlFor={id} 
      className="text-[10px] font-black uppercase opacity-40 ml-1 tracking-wider"
    >
      {label}
    </label>
    <input 
      id={id} 
      type={type}
      defaultValue={defaultValue} 
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-black/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 text-sm font-black outline-none transition-all placeholder:opacity-20"
      style={{ color: textColor }}
    />
  </div>
);

export default InputField;
