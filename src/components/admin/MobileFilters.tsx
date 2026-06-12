
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, Search } from "lucide-react";
import { useState } from "react";

interface MobileFiltersProps {
  onSearch: (value: string) => void;
  onFilter: (filters: any) => void;
  filters: Record<string, any>;
  filterOptions: {
    name: string;
    options: { label: string; value: string }[];
  }[];
}

export const MobileFilters = ({
  onSearch,
  onFilter,
  filters,
  filterOptions,
}: MobileFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filter</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              {filterOptions.map((filterGroup) => (
                <div key={filterGroup.name} className="space-y-2">
                  <h3 className="font-medium">{filterGroup.name}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {filterGroup.options.map((option) => (
                      <Button
                        key={option.value}
                        variant={filters[filterGroup.name] === option.value ? "default" : "outline"}
                        onClick={() => {
                          onFilter({
                            ...filters,
                            [filterGroup.name]: option.value,
                          });
                          setIsOpen(false);
                        }}
                        className="w-full"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};
