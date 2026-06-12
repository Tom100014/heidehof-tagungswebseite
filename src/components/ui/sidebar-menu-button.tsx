
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  asChild?: boolean;
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive = false, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "w-full justify-start gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/80",
          className
        )}
        variant="ghost"
        {...props}
      />
    );
  }
);

SidebarMenuButton.displayName = "SidebarMenuButton";

export { SidebarMenuButton };
