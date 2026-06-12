import { ClaraWebCall } from "./ClaraWebCall";
import { PhoneOff } from "lucide-react";

interface CartesiaCallButtonProps {
  variant?: "pill" | "block";
  label?: string;
  className?: string;
  agentId?: string;
}

/**
 * Primärer Voice-Button: startet einen Browser-Call mit Clara (Cartesia Agent)
 * direkt im Tab — funktioniert auf Desktop, Tablet & Mobile gleichermaßen,
 * ohne Telefonnetz und ohne Kosten für den Gast.
 *
 * Der bisherige `tel:`-Direktanruf wird durch den Browser-Call ersetzt.
 * Den klassischen Outbound-Rückruf übernimmt weiterhin `PhoneCallLauncher`.
 */
export const CartesiaCallButton = ({
  variant = "pill",
  label = "Mit Clara sprechen",
  className,
  agentId,
}: CartesiaCallButtonProps) => {
  return (
    <ClaraWebCall
      variant={variant}
      label={label}
      className={className}
      agentId={agentId}
    />
  );
};

export const PhoneOffIconUnused = PhoneOff;
