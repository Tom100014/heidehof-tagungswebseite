import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TabItem {
  value: string;
  label: string;
  count?: number;
  content: React.ReactNode;
}

interface MobileAdminTabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export const MobileAdminTabs: React.FC<MobileAdminTabsProps> = ({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className
}) => {
  return (
    <Tabs 
      defaultValue={defaultValue || tabs[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsList className="grid w-full h-auto p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex flex-col gap-1 py-2 px-3 min-h-[60px] text-xs"
          >
            <span className="font-medium leading-none">{tab.label}</span>
            {tab.count !== undefined && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {tab.count}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      
      <div className="mt-4">
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-0">
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
};