
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ConferencePrivacyCheckboxProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  error?: string;
}

const ConferencePrivacyCheckbox: React.FC<ConferencePrivacyCheckboxProps> = ({
  accepted,
  onAcceptedChange,
  error
}) => {
  return (
    <div className="flex items-start space-x-2 mb-4">
      <Checkbox
        id="privacy-checkbox"
        checked={accepted}
        onCheckedChange={(checked) => onAcceptedChange(checked === true)}
        className="mt-1"
      />
      <div className="grid gap-1.5 leading-none">
        <Label 
          htmlFor="privacy-checkbox"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Ich stimme der Verarbeitung meiner Daten zu
        </Label>
        <p className="text-xs text-muted-foreground">
          Ihre Daten werden nur zur Bearbeitung Ihrer Bestellung verwendet und nicht an Dritte weitergegeben.
        </p>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>
    </div>
  );
};

export default ConferencePrivacyCheckbox;
