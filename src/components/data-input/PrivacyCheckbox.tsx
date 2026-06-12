
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { UnifiedPrivacyCheckbox } from "@/components/ui/unified-privacy-checkbox";

interface PrivacyCheckboxProps {
  form: UseFormReturn<any>;
}

export const PrivacyCheckbox: React.FC<PrivacyCheckboxProps> = ({ form }) => {
  return (
    <UnifiedPrivacyCheckbox 
      form={form}
      fieldName="privacyAccepted"
      variant="glass"
      size="md"
      showIcon={true}
    />
  );
};
