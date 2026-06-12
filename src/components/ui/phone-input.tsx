
import React from "react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, error, ...props }, ref) => {
    const isMobile = useIsMobile();
    
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Aktuellen Wert speichern
      let value = e.target.value;
      
      // Wenn es ein komplett leeres Feld ist, setze es auf "+49 "
      if (value === "") {
        e.target.value = "+49 ";
        if (props.onChange) {
          props.onChange(e);
        }
        return;
      }
      
      // Wenn der Nutzer versucht +49 zu löschen, verhindern wir das
      if (value.length <= 3) {
        e.target.value = "+49 ";
        if (props.onChange) {
          props.onChange(e);
        }
        return;
      }
      
      // Alle Nicht-Zahlen entfernen, außer dem "+" am Anfang
      value = value.replace(/[^\d+]/g, "");
      
      // Stellen wir sicher, dass die Nummer immer mit +49 beginnt
      if (!value.startsWith("+49")) {
        // Wenn es mit + beginnt aber nicht +49, korrigieren
        if (value.startsWith("+")) {
          value = "+49" + value.substring(1);
        } else {
          // Ansonsten füge +49 hinzu
          value = "+49" + value;
        }
      }
      
      // Formatierung für bessere Lesbarkeit: +49 XXX XXXXXXX
      if (value.length > 3) {
        const countryCode = value.substring(0, 3); // +49
        let rest = value.substring(3);
        
        if (rest.length > 3) {
          const firstPart = rest.substring(0, 3);
          const secondPart = rest.substring(3);
          value = countryCode + " " + firstPart + " " + secondPart;
        } else {
          value = countryCode + " " + rest;
        }
      }
      
      e.target.value = value;
      if (props.onChange) {
        props.onChange(e);
      }
    };

    // Wir stellen sicher, dass beim ersten Fokus der Präfix +49 bereits gesetzt ist
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!e.target.value || e.target.value === "") {
        e.target.value = "+49 ";
      }
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    return (
      <div className="relative">
        <Input
          type={isMobile ? "tel" : "text"}
          inputMode="tel"
          pattern="^\+[0-9\s]{4,}$"
          placeholder="+49 123 4567890"
          maxLength={18}
          {...props}
          onChange={handleInput}
          onFocus={handleFocus}
          ref={ref}
          className={cn(
            "pl-3 h-8 text-sm",
            isMobile ? "text-sm py-2" : "",
            error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "",
            className
          )}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
