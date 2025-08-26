import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-mobile";
import { dataService } from "@/lib/services/data-service";
import { format } from "date-fns";


interface CourtHeaderProps {
  courtId: string;
  courtName: string;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  weekOffset: number;
  onWeekChange: (offset: number) => void;
  viewDays: number;
  onViewDaysChange: (days: number) => void;
  legendFilters: {
    available: boolean;
    clinic: boolean;
    myReservations: boolean;
  };
  onLegendFiltersChange: (filters: { available: boolean; clinic: boolean; myReservations: boolean; }) => void;
  selectedCourt: string | undefined;
  onCourtChange: (courtId: string | undefined) => void;
}

const CourtHeader = ({
  courtId,
  courtName,
  currentDate,
  onDateSelect,
  weekOffset,
  onWeekChange,
  viewDays,
  onViewDaysChange,
  legendFilters,
  onLegendFiltersChange,
  selectedCourt,
  onCourtChange
}: CourtHeaderProps) => {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const activeFilterLabel = React.useMemo(() => {
    if (legendFilters.available && legendFilters.clinic && legendFilters.myReservations) return "All";
    if (legendFilters.available) return "Available";
    if (legendFilters.clinic) return "Clinic";
    if (legendFilters.myReservations) return "My Reservations";
    return "All";
  }, [legendFilters]);

  const isAllOn = React.useMemo(() => (
    legendFilters.available && legendFilters.clinic && legendFilters.myReservations
  ), [legendFilters]);

  const toggleLegendFilter = React.useCallback((filterType: keyof typeof legendFilters) => {
    onLegendFiltersChange((prev) => {
      const allOn = prev.available && prev.clinic && prev.myReservations;
      const entries = Object.entries(prev) as Array<[keyof typeof prev, boolean]>;
      const numOn = entries.reduce((count, [, value]) => count + (value ? 1 : 0), 0);
      const isExclusive = numOn === 1 && prev[filterType];

      if (isExclusive) {
        // Turning off the active exclusive filter -> show all
        return { available: true, clinic: true, myReservations: true };
      }

      // Otherwise switch to exclusive mode for the selected filter
      return {
        available: filterType === 'available',
        clinic: filterType === 'clinic',
        myReservations: filterType === 'myReservations',
      };
    });
  }, [onLegendFiltersChange]);

  return (
    <div className="mb-4 space-y-3">
      {/* Header Controls */}
      <div className="px-2 sm:px-3 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-lg py-2 relative">
        <div className="flex flex-row items-center justify-between gap-1 sm:gap-2">
          {/* Left: Court selector */}
          <div className="flex items-center justify-start">
            <Select value={selectedCourt ?? 'all'} onValueChange={(v) => onCourtChange(v === 'all' ? undefined : v)}>
              <SelectTrigger className="inline-flex items-center justify-center gap-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-8 sm:h-10 px-2 sm:px-3 py-2 rounded-md font-medium transition-all duration-200 text-xs sm:text-sm whitespace-nowrap border border-border/60 bg-card shadow-sm w-auto">
                <SelectValue placeholder="Select court" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={'all'}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">All Courts</span>
                    <span className="sm:hidden">All</span>
                  </div>
                </SelectItem>
                {dataService.getAllCourts().map((courtOption) => (
                  <SelectItem key={courtOption.id} value={courtOption.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">{courtOption.name}</span>
                      <span className="sm:hidden">{courtOption.name.split(' ')[0]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Right: View Toggle Navigation */}
          <div className="bg-muted/50 rounded-lg flex-none shrink-0 flex items-center space-x-0.5 sm:space-x-1 p-0.5 sm:p-1">
            <Button
              variant={viewDays === 1 ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewDaysChange(1)}
              className="h-6 sm:h-8 px-1 sm:px-3 text-xs sm:text-sm"
            >
              Day
            </Button>
            <Button
              variant={viewDays === 3 ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewDaysChange(3)}
              className="h-6 sm:h-8 px-1 sm:px-3 text-xs sm:text-sm"
            >
              Week
            </Button>
            <Button
              variant={viewDays === 0 ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewDaysChange(0)}
              className="h-6 sm:h-8 px-1 sm:px-3 text-xs sm:text-sm"
            >
              Calendar
            </Button>
          </div>
        </div>
        
        {/* Center: Filter dropdown - absolutely positioned to true center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="inline-flex items-center justify-center gap-1 sm:gap-2 h-8 sm:h-10 px-2 sm:px-3 rounded-md shadow-sm font-medium transition-all duration-200 text-xs sm:text-sm whitespace-nowrap border border-border/60 bg-card"
                >
                  <div className="flex items-center gap-1">
                    {isAllOn ? (
                      <>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500/20 border border-green-500/30"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500/20 border border-yellow-500/30"></div>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500/20 border border-purple-500/30"></div>
                      </>
                    ) : (
                      <>
                        {legendFilters.available && (
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500/20 border border-green-500/30"></div>
                        )}
                        {legendFilters.clinic && (
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500/20 border border-yellow-500/30"></div>
                        )}
                        {legendFilters.myReservations && (
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500/20 border border-purple-500/30"></div>
                        )}
                      </>
                    )}
                  </div>
                  <span className="hidden sm:inline">Show: {activeFilterLabel}</span>
                  <span className="sm:hidden">{activeFilterLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuLabel>Filter slots</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onLegendFiltersChange({ available: true, clinic: true, myReservations: true })}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500/20 border border-green-500/30"></div>
                    <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/30"></div>
                    <div className="w-3 h-3 bg-purple-500/20 border border-purple-500/30"></div>
                    <span className="text-sm">All</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toggleLegendFilter('available')}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500/20 border border-green-500/30"></div>
                    <span className="text-sm">Available only</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toggleLegendFilter('clinic')}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/30"></div>
                    <span className="text-sm">Clinic only</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toggleLegendFilter('myReservations')}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500/20 border border-purple-500/30"></div>
                    <span className="text-sm whitespace-nowrap">My Reservations only</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Court Title with Date - positioned after controls */}
      <div className="text-center">
        <h3 className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
          {format(currentDate, "EEEE, MMMM d")} - {courtName}
        </h3>
      </div>


    </div>
  );
};

export default CourtHeader;
