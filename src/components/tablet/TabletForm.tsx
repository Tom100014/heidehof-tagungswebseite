
import React from "react";

interface TabletInputGroupProps {
  label: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

interface TabletFormProps {
  children: React.ReactNode;
  className?: string;
}

export const TabletInputGroup: React.FC<TabletInputGroupProps> = ({ 
  label, 
  error, 
  children,
  className 
}) => {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <label className="text-base font-medium">{label}</label>
      {children}
      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  );
};

export const TabletForm: React.FC<TabletFormProps> = ({ children, className }) => {
  return <div className={`tablet-form space-y-4 ${className || ''}`}>{children}</div>;
};

/**
 * A grid container for tablet forms that allows for multi-column layouts
 */
export const TabletFormGrid: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={`tablet-form-grid ${className || ''}`}>{children}</div>;
};

/**
 * A full-width form field for tablet layouts
 */
export const TabletFormFullWidth: React.FC<{ 
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return <div className={`full-width ${className || ''}`}>{children}</div>;
};
