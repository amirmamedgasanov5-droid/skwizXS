import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  className, 
  variant = 'primary', 
  isLoading,
  ...props 
}) => {
  return (
    <button
      className={clsx(
        "w-full rounded-[32px] px-6 py-4 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
        variant === 'primary' && "bg-black text-white hover:bg-gray-900",
        variant === 'secondary' && "bg-gray-100 text-black hover:bg-gray-200",
        variant === 'danger' && "bg-red-500 text-white hover:bg-red-600",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full block" />
      ) : children}
    </button>
  );
};