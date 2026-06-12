
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { ContactFormValues } from "./ContactFormSchema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormItem, FormLabel } from "@/components/ui/form";
import { Mail, XCircle } from "lucide-react";

interface ContactTypeSelectorProps {
  form: UseFormReturn<ContactFormValues>;
  contactType: string;
}

export const ContactTypeSelector: React.FC<ContactTypeSelectorProps> = ({ form, contactType }) => {
  return (
    <div className="space-y-2.5">
      <FormLabel className="text-sm font-medium flex items-center gap-2">
        Kontaktmethode
      </FormLabel>
      <RadioGroup 
        className="grid grid-cols-2 gap-2"
        value={contactType}
        onValueChange={(value) => {
          form.setValue("contactMethod", value as "email" | "none");
          if (value === "none") {
            form.setValue("contactValue", "keine Kontaktaufnahme gewünscht");
          } else if (form.getValues("contactValue") === "keine Kontaktaufnahme gewünscht") {
            form.setValue("contactValue", "");
          }
        }}
      >
        <FormItem className="flex items-center space-x-2 space-y-0">
          <RadioGroupItem value="email" id="email" />
          <FormLabel htmlFor="email" className="cursor-pointer text-sm flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-gold/70" />
            E-Mail
          </FormLabel>
        </FormItem>
        
        <FormItem className="flex items-center space-x-2 space-y-0">
          <RadioGroupItem value="none" id="none" />
          <FormLabel htmlFor="none" className="cursor-pointer text-sm flex items-center gap-1.5">
            <XCircle className="h-3 w-3 text-gold/70" />
            Keine Kontaktierung
          </FormLabel>
        </FormItem>
      </RadioGroup>
    </div>
  );
};
