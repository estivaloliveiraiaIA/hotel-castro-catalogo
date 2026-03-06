import { Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

interface PartnerBadgeProps {
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export const PartnerBadge = ({ label = "Parceiro do Hotel", size = "sm", className }: PartnerBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-hotel-gold/60 bg-hotel-gold/10 font-medium text-hotel-gold",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-sm",
        className
      )}
    >
      <Handshake className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {label}
    </span>
  );
};
