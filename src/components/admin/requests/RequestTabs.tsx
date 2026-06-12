
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RequestTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  newOrdersCount: number;
  newRestaurantCount: number;
  newBeautyCount: number;
  totalNewCount: number;
}

export const RequestTabs: React.FC<RequestTabsProps> = ({
  activeTab,
  onTabChange,
  newOrdersCount,
  newRestaurantCount,
  newBeautyCount,
  totalNewCount
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger 
          value="beauty"
          className={cn(
            "relative overflow-hidden", 
            newBeautyCount > 0 && "animate-pulse-subtle"
          )}
        >
          Beauty {newBeautyCount > 0 && (
            <Badge 
              variant="outline" 
              className={cn(
                "ml-2 bg-pink-500 text-white border-none",
                "relative after:absolute after:inset-0 after:bg-white/20 after:animate-pulse" 
              )}
            >
              {newBeautyCount}
            </Badge>
          )}
          {newBeautyCount > 0 && (
            <span className="absolute inset-0 bg-pink-500/5 animate-pulse rounded-md pointer-events-none"></span>
          )}
        </TabsTrigger>
        
        <TabsTrigger value="all">
          Alle Beschwerden {totalNewCount > 0 && <Badge variant="outline" className="ml-2 bg-red-500 text-white border-none">{totalNewCount}</Badge>}
        </TabsTrigger>
        
        <TabsTrigger value="regular">
          Room Service {newOrdersCount > 0 && <Badge variant="outline" className="ml-2 bg-blue-500 text-white border-none">{newOrdersCount}</Badge>}
        </TabsTrigger>
        
        <TabsTrigger value="restaurant">
          Bar Mäx Snacks {newRestaurantCount > 0 && <Badge variant="outline" className="ml-2 bg-amber-500 text-white border-none">{newRestaurantCount}</Badge>}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
