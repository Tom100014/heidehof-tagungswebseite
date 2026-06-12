
import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useDeviceType } from '@/hooks/use-device-type';

interface MobileTableProps {
  data: any[];
  columns: {
    header: string;
    accessorKey: string;
    cell?: (row: any) => React.ReactNode;
  }[];
  className?: string;
  onRowClick?: (row: any) => void;
}

export const MobileTable = ({ 
  data, 
  columns, 
  className,
  onRowClick 
}: MobileTableProps) => {
  const { isMobile, isTablet } = useDeviceType();

  if (isMobile) {
    // Mobile card view (stacked)
    return (
      <div className="space-y-4 pb-16">
        {data.map((row, i) => (
          <div 
            key={i} 
            className="bg-card p-4 rounded-lg border border-border/50 space-y-3"
            onClick={() => onRowClick?.(row)}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
          >
            {columns.map((col, j) => (
              <div key={j} className="flex flex-wrap justify-between items-baseline gap-2">
                <span className="text-sm text-muted-foreground">{col.header}:</span>
                <span className="font-medium text-right mobile-text-control">
                  {col.cell ? col.cell(row) : row[col.accessorKey]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  
  if (isTablet) {
    // Tablet optimized table view - simplified with larger touch targets
    return (
      <div className="overflow-x-auto pb-6">
        <Table className={cn("w-full", className)}>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className="text-base py-3">{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow 
                key={i}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? "cursor-pointer hover:bg-muted/50 h-14" : "h-14"}
              >
                {columns.map((col, j) => (
                  <TableCell key={j} className="py-3 text-base">
                    {col.cell ? col.cell(row) : row[col.accessorKey]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Desktop view (standard table)
  return (
    <div className="overflow-x-auto">
      <Table className={cn("w-full", className)}>
        <TableHeader>
          <TableRow>
            {columns.map((col, i) => (
              <TableHead key={i}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow 
              key={i}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
            >
              {columns.map((col, j) => (
                <TableCell key={j}>
                  {col.cell ? col.cell(row) : row[col.accessorKey]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
