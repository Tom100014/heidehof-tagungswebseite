import { useState, useCallback } from 'react';
import { UseFormReturn, FieldPath, FieldValues } from 'react-hook-form';
import { useHotelSettings } from './useHotelSettings';
import { normalizeRoomNumber, normalizeKeyNumber } from '@/utils/form-validation';

interface UseFormValidationProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  type: 'room' | 'key';
}

export const useFormValidation = <T extends FieldValues>({ 
  form, 
  type 
}: UseFormValidationProps<T>) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { isValidNumber, getSuggestions } = useHotelSettings();

  const validateValue = useCallback((value: string, fieldName: FieldPath<T>) => {
    if (!value || value.length !== 3) return true;
    
    const isValid = isValidNumber(value, type);
    if (!isValid) {
      form.setError(fieldName, {
        type: 'manual',
        message: `${type === 'room' ? 'Zimmernummer' : 'Schlüsselnummer'} ${value} ist nicht gültig`
      });
      return false;
    } else {
      form.clearErrors(fieldName);
      return true;
    }
  }, [form, isValidNumber, type]);

  const handleInputChange = useCallback((
    value: string, 
    fieldName: FieldPath<T>,
    onChange: (value: string) => void
  ) => {
    // Nur Zahlen, max 3 Zeichen
    const cleanValue = value.replace(/\D/g, '').slice(0, 3);
    onChange(cleanValue);

    // Update suggestions
    if (cleanValue.length > 0) {
      const newSuggestions = getSuggestions(type, cleanValue);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0 && newSuggestions[0] !== cleanValue.padStart(3, '0'));
    } else {
      setShowSuggestions(false);
    }

    // Real-time validation for 3-digit values
    if (cleanValue.length === 3) {
      validateValue(cleanValue, fieldName);
    }
  }, [getSuggestions, type, validateValue]);

  const handleInputBlur = useCallback((
    value: string,
    fieldName: FieldPath<T>,
    onChange: (value: string) => void
  ) => {
    const trimmedValue = value.trim();
    
    if (/^\d{1,3}$/.test(trimmedValue) && trimmedValue !== '') {
      const normalized = type === 'room' 
        ? normalizeRoomNumber(trimmedValue) 
        : normalizeKeyNumber(trimmedValue);
      onChange(normalized);
      validateValue(normalized, fieldName);
    }
    
    setTimeout(() => setShowSuggestions(false), 200);
  }, [type, validateValue]);

  const selectSuggestion = useCallback((suggestion: string, onChange: (value: string) => void) => {
    onChange(suggestion);
    setShowSuggestions(false);
  }, []);

  return {
    suggestions,
    showSuggestions,
    handleInputChange,
    handleInputBlur,
    selectSuggestion,
    validateValue
  };
};