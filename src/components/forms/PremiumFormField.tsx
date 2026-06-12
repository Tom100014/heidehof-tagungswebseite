import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
  severity: 'error' | 'warning';
}

interface PremiumFormFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'password' | 'phone' | 'room' | 'name' | 'key';
  icon?: React.ReactNode;
  required?: boolean;
  description?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  autoComplete?: string;
  rules?: ValidationRule[];
  rows?: number;
  autoValidate?: boolean; // Legacy prop - ignored but kept for backward compatibility
}

export const PremiumFormField: React.FC<PremiumFormFieldProps> = ({
  form,
  name,
  label,
  placeholder,
  type = 'text',
  icon,
  required = false,
  description,
  disabled = false,
  maxLength,
  className,
  autoComplete,
  rules = [],
  rows = 3
}) => {
  const [isTouched, setIsTouched] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [validationState, setValidationState] = useState<{
    errors: string[];
    warnings: string[];
  }>({ errors: [], warnings: [] });

  const fieldState = form.getFieldState(name);
  const fieldValue = form.watch(name) || '';
  const isValid = fieldState.isDirty && !fieldState.error && validationState.errors.length === 0;
  const hasError = fieldState.error || validationState.errors.length > 0;

  // Real-time validation with custom rules
  useEffect(() => {
    if (!isTouched || rules.length === 0) return;

    const errors: string[] = [];
    const warnings: string[] = [];

    rules.forEach(rule => {
      if (!rule.test(fieldValue)) {
        if (rule.severity === 'error') {
          errors.push(rule.message);
        } else {
          warnings.push(rule.message);
        }
      }
    });

    setValidationState({ errors, warnings });
  }, [fieldValue, rules, isTouched]);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("relative", className)}>
          <FormLabel className="text-sm md:text-base font-medium text-foreground flex items-center gap-2 mb-2">
            {icon && <span className="text-gold">{icon}</span>}
            <span>{label}</span>
            {required && <span className="text-gold ml-1">*</span>}
          </FormLabel>
          
          <div className="relative">
            <FormControl>
              {type === 'textarea' ? (
                <Textarea
                  placeholder={isFocused ? "" : placeholder}
                  disabled={disabled}
                  maxLength={maxLength}
                  rows={rows}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    setIsFocused(false);
                    setIsTouched(true);
                  }}
                  className={cn(
                    "relative z-10",
                    hasError && "border-destructive/50 bg-destructive/5",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  {...field}
                />
              ) : (
                <Input
                  type={
                    type === 'phone' || type === 'tel' ? 'tel' :
                    type === 'email' ? 'email' :
                    type === 'room' || type === 'key' || type === 'number' ? 'text' :
                    type === 'password' ? 'password' :
                    'text'
                  }
                  placeholder={isFocused ? "" : placeholder}
                  disabled={disabled}
                  maxLength={maxLength || (type === 'room' || type === 'key' ? 3 : undefined)}
                  autoComplete={autoComplete || (
                    type === 'email' ? 'email' :
                    type === 'phone' || type === 'tel' ? 'tel' :
                    type === 'name' ? 'name' :
                    'off'
                  )}
                  inputMode={
                    type === 'tel' || type === 'phone' ? 'tel' :
                    type === 'email' ? 'email' :
                    type === 'number' || type === 'room' || type === 'key' ? 'numeric' :
                    'text'
                  }
                  onChange={(e) => {
                    let value = e.target.value;
                    // Handle special input types
                    if (type === 'room' || type === 'key') {
                      value = value.replace(/\D/g, '').slice(0, 3);
                    } else if (type === 'name') {
                      value = value.replace(/[^a-zA-ZäöüÄÖÜß\s\-\.]/g, '');
                    } else if (type === 'phone' || type === 'tel') {
                      value = value.replace(/[^0-9\+\s\-]/g, '');
                    }
                    field.onChange(value);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => {
                    setIsFocused(false);
                    setIsTouched(true);
                    field.onBlur();
                  }}
                  className={cn(
                    "relative z-10",
                    hasError && "border-destructive/50 bg-destructive/5 pr-10",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  value={field.value || ''}
                  ref={field.ref}
                  name={field.name}
                />
              )}
            </FormControl>
            
            {/* Validation Icon */}
            {type !== 'textarea' && hasError && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <AlertCircle className="h-5 w-5 text-destructive animate-scale-in" />
              </div>
            )}
          </div>
          
          {/* Custom Validation Messages */}
          {isTouched && validationState.errors.length > 0 && (
            <div className="space-y-1 mt-1.5">
              {validationState.errors.map((error, index) => (
                <div key={`error-${index}`} className="flex items-start gap-2 text-xs text-destructive animate-fade-in">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          )}

          {isTouched && validationState.warnings.length > 0 && validationState.errors.length === 0 && (
            <div className="space-y-1 mt-1.5">
              {validationState.warnings.map((warning, index) => (
                <div key={`warning-${index}`} className="flex items-start gap-2 text-xs text-yellow-500 animate-fade-in">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {description && !hasError && validationState.errors.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {description}
            </p>
          )}
          
          <FormMessage className="text-xs mt-1.5 animate-fade-in" />
        </FormItem>
      )}
    />
  );
};
