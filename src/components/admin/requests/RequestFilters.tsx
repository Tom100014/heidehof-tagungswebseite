
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RequestFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  activeTab: string;
  showTypeFilter?: boolean;
}

export const RequestFilters: React.FC<RequestFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  activeTab,
  showTypeFilter = false
}) => {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Suchen..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div>
        <Tabs value={statusFilter} onValueChange={onStatusChange} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="pending">Neu</TabsTrigger>
            <TabsTrigger value="processing">In Bearbeitung</TabsTrigger>
            <TabsTrigger value="completed">Erledigt</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {showTypeFilter && activeTab === "all" && (
        <div>
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {typeFilter === "all" ? "Alle Typen" : 
                 typeFilter === "bar_max" ? "Bar Mäx (Getränke)" :
                 typeFilter === "bar_max_snacks" ? "Bar Mäx (Snacks)" :
                 typeFilter === "restaurant" ? "Restaurant Maxwell" : 
                 "Anderer Typ"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="bar_max">Bar Mäx (Getränke)</SelectItem>
              <SelectItem value="bar_max_snacks">Bar Mäx (Snacks)</SelectItem>
              <SelectItem value="restaurant">Restaurant Maxwell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};
