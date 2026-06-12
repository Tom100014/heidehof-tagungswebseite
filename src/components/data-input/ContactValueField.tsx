
import React, { useEffect } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ContactFormValues, validateEmail } from "./ContactFormSchema";
import { AtSign } from "lucide-react";

interface ContactValueFieldProps {
  form: UseFormReturn<ContactFormValues>;
  contactType: string;
}

export const ContactValueField: React.FC<ContactValueFieldProps> = ({ form, contactType }) => {
  if (contactType === "none") {
    return null;
  }

  // Setting up default values for email option
  const icon = <AtSign className="h-3.5 w-3.5 text-gold/80" />;
  const label = "E-Mail";
  const placeholder = "max.mustermann@example.com";
  const inputType = "email";
  const description = "Wir senden Ihnen eine Bestätigung per E-Mail";

  // Live-Validierung für besseres Nutzerfeedback
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("contactValue", value);
    
    // Validierung während der Eingabe für besseres Feedback
    if (value) {
      let isValid = validateEmail(value);
      let errorMessage = isValid ? "" : "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
      
      if (!isValid) {
        form.setError("contactValue", { message: errorMessage });
      } else {
        form.clearErrors("contactValue");
      }
    } else {
      form.setError("contactValue", { message: "Dieses Feld ist erforderlich." });
    }
  };

  // Aktualisieren des Feldes, wenn sich contactType ändert
  useEffect(() => {
    // Bei Änderung der Kontaktmethode Feld zurücksetzen und Fehler löschen
    form.setValue("contactValue", "");
    form.clearErrors("contactValue");
  }, [contactType, form]);

  return (
    <FormField
      control={form.control}
      name="contactValue"
      rules={{ required: "Dieses Feld ist erforderlich" }}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2 font-medium text-sm">
            {icon}
            {label} <span className="text-destructive">*</span>
          </FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              type={inputType}
              className="bg-card border-gold/10 focus-visible:border-gold/30 focus-visible:ring-gold/30 text-sm h-9"
              {...field}
              required={true}
              onChange={handleInputChange}
              autoComplete="email"
            />
          </FormControl>
          {description && (
            <FormDescription className="text-xs text-muted-foreground">
              {description}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
