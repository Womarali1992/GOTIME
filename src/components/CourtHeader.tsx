import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, Calendar, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-mobile";
import { dataService } from "@/lib/services/data-service";
import { format, addDays, subDays } from "date-fns";



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
    social: boolean;
    myReservations: boolean;
  };
  onLegendFiltersChange: (filters: { available: boolean; clinic: boolean; social: boolean; myReservations: boolean; }) => void;
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
    if (legendFilters.available && legendFilters.clinic && legendFilters.social && legendFilters.myReservations) return "All";
    if (legendFilters.available) return "Available";
    if (legendFilters.clinic) return "Clinic";
    if (legendFilters.social) return "Social";
    if (legendFilters.myReservations) return "My Reservations";
    return "All";
  }, [legendFilters]);

  const isAllOn = React.useMemo(() => (
    legendFilters.available && legendFilters.clinic && legendFilters.social && legendFilters.myReservations
  ), [legendFilters]);

  const toggleLegendFilter = React.useCallback((filterType: keyof typeof legendFilters) => {
    onLegendFiltersChange((prev) => {
      const allOn = prev.available && prev.clinic && prev.social && prev.myReservations;
      const entries = Object.entries(prev) as Array<[keyof typeof prev, boolean]>;
      const numOn = entries.reduce((count, [, value]) => count + (value ? 1 : 0), 0);
      const isExclusive = numOn === 1 && prev[filterType];

      if (isExclusive) {
        // Turning off the active exclusive filter -> show all
        return { available: true, clinic: true, social: true, myReservations: true };
      }

      // Otherwise switch to exclusive mode for the selected filter
      return {
        available: filterType === 'available',
        clinic: filterType === 'clinic',
        social: filterType === 'social',
        myReservations: filterType === 'myReservations',
      };
    });
  }, [onLegendFiltersChange]);

  // Navigation functions
  const navigatePrevious = React.useCallback(() => {
    const previousDate = subDays(currentDate, 1);
    // Don't go before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (previousDate >= today) {
      onDateSelect(previousDate);
    }
  }, [currentDate, onDateSelect]);

  const navigateNext = React.useCallback(() => {
    const nextDate = addDays(currentDate, 1);
    onDateSelect(nextDate);
  }, [currentDate, onDateSelect]);

  // Check if previous navigation is disabled
  const isPreviousDisabled = React.useMemo(() => {
    const previousDate = subDays(currentDate, 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return previousDate < today;
  }, [currentDate]);

  return (
    <>
      {/* Top Bar - View Toggle Buttons and Court Selector at the very top */}
      <div className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex flex-row items-center py-0.5 sm:py-1 px-2 sm:px-4">
          {/* Left: Court selector */}
          <div className="flex items-center justify-start flex-1">
            <Select value={selectedCourt ?? 'all'} onValueChange={(v) => onCourtChange(v === 'all' ? undefined : v)}>
              <SelectTrigger className="inline-flex items-center justify-center gap-1 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0 !h-6 sm:!h-8 px-1 sm:px-2 py-0 sm:py-1 rounded-md font-medium transition-all duration-200 text-xs whitespace-nowrap border border-border/60 bg-card shadow-sm w-auto min-h-0">
                <SelectValue placeholder="Select court" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={'all'}>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    <span>All Courts</span>
                  </div>
                </SelectItem>
                {dataService.getAllCourts().map((courtOption) => (
                  <SelectItem key={courtOption.id} value={courtOption.id}>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />
                      <span>{courtOption.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Center: Filter dropdown */}
          <div className="flex items-center justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="inline-flex items-center justify-center gap-1 !h-6 sm:!h-8 px-1 sm:px-2 py-0 sm:py-1 rounded-md shadow-sm font-medium transition-all duration-200 text-xs whitespace-nowrap border border-border/60 bg-card min-h-0"
                >
                  <div className="flex items-center justify-center gap-0.5">
                    {isAllOn ? (
                      <>
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500/20 border border-green-500/30"></div>
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-yellow-500/20 border border-yellow-500/30"></div>
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-orange-300/30 border border-orange-400/40"></div>
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-purple-500/20 border border-purple-500/30"></div>
                      </>
                    ) : (
                      <>
                        {legendFilters.available && (
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500/20 border border-green-500/30"></div>
                        )}
                        {legendFilters.clinic && (
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-yellow-500/20 border border-yellow-500/30"></div>
                        )}
                        {legendFilters.social && (
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-orange-300/30 border border-orange-400/40"></div>
                        )}
                        {legendFilters.myReservations && (
                          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-purple-500/20 border border-purple-500/30"></div>
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-center">{activeFilterLabel}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuLabel>Filter slots</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onLegendFiltersChange({ available: true, clinic: true, social: true, myReservations: true })}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500/20 border border-green-500/30"></div>
                    <div className="w-3 h-3 bg-yellow-500/20 border border-yellow-500/30"></div>
                    <div className="w-3 h-3 bg-orange-300/30 border border-orange-400/40"></div>
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
                <DropdownMenuItem onSelect={() => toggleLegendFilter('social')}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-300/30 border border-orange-400/40"></div>
                    <span className="text-sm">Social only</span>
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
          
          {/* Right: View Toggle Buttons */}
          <div className="flex items-center justify-end flex-1">
            <div className="bg-muted/50 rounded-lg flex-none shrink-0 flex items-center space-x-0.5 p-0.5">
              <Button
                variant={viewDays === 1 ? "default" : "ghost"}
                onClick={() => onViewDaysChange(1)}
                className="!h-6 sm:!h-7 px-1 sm:px-1.5 py-0 sm:py-0.5 text-xs min-h-0 min-w-0"
              >
                1D
              </Button>
              <Button
                variant={viewDays === 3 ? "default" : "ghost"}
                onClick={() => onViewDaysChange(3)}
                className="!h-6 sm:!h-7 px-1 sm:px-1.5 py-0 sm:py-0.5 text-xs min-h-0 min-w-0"
              >
                3D
              </Button>
              <Button
                variant={viewDays === 0 ? "default" : "ghost"}
                onClick={() => onViewDaysChange(0)}
                className="!h-6 sm:!h-7 px-1 sm:px-1.5 py-0 sm:py-0.5 text-xs min-h-0 min-w-0"
              >
                <Calendar className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Court Name and Date Section */}
      <div className="px-2 sm:px-3 py-3 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-b border-border/30">
        <div className="text-center">
          {/* Mobile: Stack court name and date */}
          <div className="sm:hidden">
            <div 
              className="text-sm font-semibold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent cursor-pointer hover:opacity-70 transition-opacity"
              onClick={() => onDateSelect(new Date())}
              title="Click to go back to today"
            >
              {dataService.reservationSettings?.courtName || 'Pickleball Court'}
            </div>
            {courtName !== "All Courts" && (
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                {`${format(currentDate, "EEEE, MMMM d")} - ${courtName}`}
              </h2>
            )}
          </div>
          
          {/* Desktop: Single line */}
          {courtName !== "All Courts" && (
            <h2 className="hidden sm:block text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              <span 
                className="cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => onDateSelect(new Date())}
                title="Click to go back to today"
              >
                {dataService.reservationSettings?.courtName || 'Pickleball Court'}
              </span>
              {` ${format(currentDate, "EEEE, MMMM d")} - ${courtName}`}
            </h2>
          )}
        </div>
      </div>


    </>
  );
};

export default CourtHeader;
