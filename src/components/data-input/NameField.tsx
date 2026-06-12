
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ContactFormValues } from './ContactFormSchema';

interface NameFieldProps {
  form: UseFormReturn<ContactFormValues>;
}

export const NameField: React.FC<NameFieldProps> = ({ form }) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Nur Buchstaben, Leerzeichen, Bindestriche und Punkte erlauben
    value = value.replace(/[^a-zA-ZäöüÄÖÜß\s\-\.]/g, '');
    form.setValue('name', value);
  };

  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-foreground">
            Name (mind. 3 Buchstaben) <span className="text-red-500">*</span>
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="Ihr vollständiger Name"
              className="w-full px-4 py-3 rounded-xl h-12 bg-background border-2 border-input text-foreground placeholder:text-muted-foreground focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all duration-200"
              onChange={handleNameChange}
              maxLength={50}
            />
          </FormControl>
          <FormMessage className="text-xs text-destructive" />
        </FormItem>
      )}
    />
  );
};
