
import React from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Bitte geben Sie Ihren Namen ein.",
  }),
  roomNumber: z.string().min(1, {
    message: "Bitte geben Sie Ihre Zimmernummer ein.",
  }),
  date: z.date({
    required_error: "Bitte wählen Sie ein Datum.",
  }),
  timePreference: z.enum(["morning", "afternoon", "evening"], {
    required_error: "Bitte wählen Sie eine Tageszeit.",
  }),
  contactMethod: z.enum(["email", "whatsapp"]),
  contactValue: z.string().min(4, {
    message: "Bitte geben Sie eine gültige E-Mail-Adresse oder Telefonnummer ein.",
  }),
  notes: z.string().optional(),
});

export type UniversalAppointmentFormValues = z.infer<typeof formSchema>;

interface UniversalAppointmentFormProps {
  title?: string;
  description?: string;
  serviceItem?: {
    name: string;
    price?: string;
    time?: string;
  };
  onSubmit: (values: UniversalAppointmentFormValues) => void;
  className?: string;
}

const UniversalAppointmentForm = ({ 
  title = "Termin vereinbaren",
  description,
  serviceItem,
  onSubmit,
  className 
}: UniversalAppointmentFormProps) => {
  const form = useForm<UniversalAppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      roomNumber: "",
      timePreference: "afternoon",
      contactMethod: "email",
      contactValue: "",
      notes: "",
    },
  });

  const handleSubmit = (values: UniversalAppointmentFormValues) => {
    onSubmit(values);
  };

  // Get tomorrow's date for the date picker minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {(title || serviceItem) && (
            <div className="mb-4">
              <h3 className="font-medium text-gold-light">{serviceItem?.name || title}</h3>
              {serviceItem && (
                <p className="text-sm text-muted-foreground">
                  {serviceItem.price && serviceItem.time 
                    ? `${serviceItem.price} - ${serviceItem.time}`
                    : serviceItem.price || serviceItem.time
                  }
                </p>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Ihr vollständiger Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="roomNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zimmernummer</FormLabel>
                <FormControl>
                  <Input placeholder="z.B. 101" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Gewünschtes Datum</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal border-gold/50",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Datum wählen</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        return date < tomorrow;
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="timePreference"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Bevorzugte Tageszeit</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="morning" id="morning" />
                      <label htmlFor="morning" className="text-sm">Vormittag (8:00 - 12:00)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="afternoon" id="afternoon" />
                      <label htmlFor="afternoon" className="text-sm">Nachmittag (12:00 - 17:00)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="evening" id="evening" />
                      <label htmlFor="evening" className="text-sm">Abend (17:00 - 20:00)</label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kontaktmethode für Bestätigung</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="border-gold/50">
                      <SelectValue placeholder="Wählen Sie eine Kontaktmethode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="email">E-Mail</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {form.watch("contactMethod") === "email" ? "E-Mail-Adresse" : "WhatsApp-Nummer"}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={
                      form.watch("contactMethod") === "email" 
                        ? "ihre.email@beispiel.com" 
                        : "+49123456789"
                    } 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Anmerkungen (optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Besondere Wünsche oder Informationen"
                    className="resize-none border-gold/50"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            variant="gold"
            className="w-full shadow-md"
          >
            Termin anfragen
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default UniversalAppointmentForm;
