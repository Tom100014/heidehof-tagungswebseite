
import React from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { ContactFormValues } from "./ContactFormSchema";
import { Bell } from "lucide-react";

interface AllowContactCheckboxProps {
  form: UseFormReturn<ContactFormValues>;
}

export const AllowContactCheckbox: React.FC<AllowContactCheckboxProps> = ({ form }) => {
  const contactMethod = form.watch("contactMethod");
  
  if (contactMethod === "none") {
    return null;
  }
  
  return (
    <FormField
      control={form.control}
      name="allowFutureContact"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gold/20 p-4 bg-black/20">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="text-sm flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-gold" />
              Ich bin einverstanden, dass das Hotel mir Infos zu meiner Bestellung schickt
            </FormLabel>
            <FormDescription className="text-xs">
              Diese Einwilligung können Sie jederzeit widerrufen.
            </FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
};
