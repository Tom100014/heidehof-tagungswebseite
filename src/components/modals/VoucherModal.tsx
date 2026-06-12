import React from 'react';
import UniversalIframeModal from "@/components/ui/universal-iframe-modal";

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoucherModal: React.FC<VoucherModalProps> = ({ isOpen, onClose }) => {
  return (
    <UniversalIframeModal
      open={isOpen}
      onOpenChange={onClose}
      src="https://voucherbooking.de/parkhotelheidehof"
      title="Gutscheine - Hotel Der Heidehof"
      description="Gutschein Buchung für Hotel Der Heidehof"
      allowPayment={true}
      fallbackUrl="https://voucherbooking.de/parkhotelheidehof"
    />
  );
};

export default VoucherModal;