
import React from "react";
import { FormProvider, UseFormReturn } from "react-hook-form";

interface MobileInputGroupProps {
  label: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

interface MobileFormProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileInputGroup: React.FC<MobileInputGroupProps> = ({ 
  label, 
  error, 
  children,
  className 
}) => {
  return (
    <div className={`space-y-1.5 mb-4 ${className || ''}`}>
      <label className="text-base font-medium form-label">{label}</label>
      {children}
      {error && (
        <p className="text-sm text-destructive form-error">{error}</p>
      )}
    </div>
  );
};

export const MobileForm: React.FC<MobileFormProps> = ({ children, className }) => {
  return (
    <div className={`space-y-4 pb-8 overflow-y-auto -webkit-overflow-scrolling-touch max-h-screen ${className || ''}`} style={{ WebkitOverflowScrolling: 'touch' }}>
      {children}
    </div>
  );
};
