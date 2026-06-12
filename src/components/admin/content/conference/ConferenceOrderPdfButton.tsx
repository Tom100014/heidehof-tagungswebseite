import React from "react";
import { Button } from "@/components/ui/button";

const ConferenceOrderPdfButton: React.FC<Record<string, unknown>> = () => (
  <Button variant="outline" disabled className="w-full">
    PDF (in Vorbereitung)
  </Button>
);

export default ConferenceOrderPdfButton;
