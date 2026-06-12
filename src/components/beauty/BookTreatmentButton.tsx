import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { BookingDrawer } from "./BookingDrawer";

interface Props {
  treatmentSlug?: string;
  treatmentId?: string;
  treatmentTitle: string;
  priceLabel?: string | null;
  durationLabel?: string | null;
  className?: string;
}

export function BookTreatmentButton(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`border-gold/40 text-gold hover:bg-gold/10 hover:text-gold ${props.className ?? ""}`}
      >
        <Calendar className="h-3.5 w-3.5 mr-1.5" />
        Termin buchen
      </Button>
      <BookingDrawer
        open={open}
        onOpenChange={setOpen}
        treatmentSlug={props.treatmentSlug}
        treatmentId={props.treatmentId}
        treatmentTitle={props.treatmentTitle}
        priceLabel={props.priceLabel}
        durationLabel={props.durationLabel}
      />
    </>
  );
}
