
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface AdminStatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  trend?: "increase" | "decrease" | "neutral";
}

export function AdminStatsCard({
  title,
  value,
  description,
  icon,
  trend
}: AdminStatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            {trend && (
              <span className={cn(
                "inline-flex",
                trend === "increase" && "text-zinc-500",
                trend === "decrease" && "text-red-500"
              )}>
                {trend === "increase" ? (
                  <ArrowUpIcon className="h-3 w-3" />
                ) : trend === "decrease" ? (
                  <ArrowDownIcon className="h-3 w-3" />
                ) : null}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
