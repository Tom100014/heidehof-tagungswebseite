
import React from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { Shield, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UnifiedPrivacyCheckboxProps {
  form: UseFormReturn<any>;
  fieldName?: string;
  variant?: "default" | "glass" | "dark";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const UnifiedPrivacyCheckbox: React.FC<UnifiedPrivacyCheckboxProps> = ({
  form,
  fieldName = "privacyAccepted",
  variant = "default",
  size = "md",
  showIcon = true
}) => {
  const isMobile = useIsMobile();
  const hasError = !!form.formState.errors[fieldName];
  
  // Responsive Größen
  const sizeClasses = {
    sm: {
      container: "p-3",
      text: isMobile ? "text-sm" : "text-xs",
      icon: "h-3.5 w-3.5",
      checkbox: "h-4 w-4"
    },
    md: {
      container: "p-4",
      text: isMobile ? "text-base" : "text-sm",
      icon: "h-4 w-4",
      checkbox: "h-5 w-5"
    },
    lg: {
      container: "p-5",
      text: isMobile ? "text-lg" : "text-base",
      icon: "h-5 w-5",
      checkbox: "h-6 w-6"
    }
  };

  // Variant-spezifische Styles
  const variantClasses = {
    default: {
      container: hasError 
        ? "border-red-500 bg-red-50/80 backdrop-blur-sm" 
        : "border-gray-200 bg-gray-50/80 backdrop-blur-sm",
      text: "text-gray-700",
      link: "text-blue-600 hover:text-blue-800",
      icon: "text-gray-600",
      checkbox: "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
    },
    glass: {
      container: hasError 
        ? "border-red-400/50 bg-red-500/10 backdrop-blur-md" 
        : "border-white/30 bg-white/20 backdrop-blur-md shadow-lg",
      text: "text-gray-800",
      link: "text-blue-700 hover:text-blue-900 font-medium",
      icon: "text-gray-700",
      checkbox: "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 bg-white/50"
    },
    dark: {
      container: hasError 
        ? "border-red-500/50 bg-red-500/20 backdrop-blur-sm" 
        : "border-gold/30 bg-black/20 backdrop-blur-sm",
      text: "text-gray-100",
      link: "text-gold hover:text-gold-light font-medium",
      icon: "text-gold",
      checkbox: "data-[state=checked]:bg-gold data-[state=checked]:border-gold data-[state=checked]:text-black"
    }
  };

  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field }) => (
        <FormItem className={`
          flex flex-row items-start space-x-3 space-y-0 rounded-lg border transition-all duration-200
          ${currentSize.container} ${currentVariant.container}
          ${isMobile ? 'mobile-touch-target' : ''}
        `}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              className={`
                ${currentSize.checkbox} ${currentVariant.checkbox}
                transition-all duration-200 mt-0.5 flex-shrink-0
                ${hasError ? 'border-red-500' : ''}
              `}
            />
          </FormControl>
          <div className="space-y-1 leading-none flex-1 min-w-0">
            <FormDescription className={`
              ${currentSize.text} ${currentVariant.text} 
              flex items-start gap-2 leading-relaxed
            `}>
              {showIcon && (
                <Shield className={`${currentSize.icon} ${currentVariant.icon} mt-0.5 flex-shrink-0`} />
              )}
              <span className="flex-1">
                Ich stimme der Verarbeitung meiner personenbezogenen Daten gemäß der{" "}
                <a
                  href="/datenschutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    ${currentVariant.link} underline underline-offset-2 
                    inline-flex items-center gap-1 transition-colors duration-200
                    ${isMobile ? 'mobile-touch-target' : ''}
                  `}
                  onClick={(e) => e.stopPropagation()}
                >
                  Datenschutzerklärung
                  <ExternalLink className="h-3 w-3" />
                </a>
                {" "}zu. Die Daten werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet und nicht an Dritte weitergegeben.
              </span>
            </FormDescription>
            {hasError && (
              <FormMessage className={`
                ${isMobile ? 'text-sm' : 'text-xs'} text-red-600 font-medium mt-2
                ${variant === 'dark' ? 'text-red-400' : 'text-red-600'}
              `} />
            )}
          </div>
        </FormItem>
      )}
    />
  );
};

export default UnifiedPrivacyCheckbox;
