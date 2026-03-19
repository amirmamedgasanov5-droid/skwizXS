import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2 ml-4">{label}</label>}
      <input
        className={clsx("squwiz-input w-full", error && "border-red-500 box-shadow-red", className)}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-2 ml-4">{error}</p>}
    </div>
  );
};