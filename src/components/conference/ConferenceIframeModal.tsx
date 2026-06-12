import React from 'react';
import UniversalIframeModal from "@/components/ui/universal-iframe-modal";

interface ConferenceIframeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ConferenceIframeModal = ({
  open,
  onOpenChange
}: ConferenceIframeModalProps) => {
  return (
    <UniversalIframeModal
      open={open}
      onOpenChange={onOpenChange}
      src="https://www.der-heidehof.de/de/bankett-tagung.html"
      title="Bankett & Tagung - Der Heidehof"
      description="Informationen zu Banketten und Tagungen im Hotel Der Heidehof"
      fallbackUrl="https://www.der-heidehof.de/de/bankett-tagung.html"
    />
  );
};
export default ConferenceIframeModal;