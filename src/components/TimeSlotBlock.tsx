import React from "react";
import { User, GraduationCap, Users } from "lucide-react";
import { TimeSlot, Court, Clinic } from "@/lib/types";
import { cn } from "@/lib/utils";

// Type definitions for time slot blocks
export interface TimeSlotBlockData {
  startTime: string;  // "HH:MM" format
  endTime: string;    // "HH:MM" format
  isClinic: boolean;
  clinic: Clinic | null;
  slot: TimeSlot | null;
  available: boolean;
  reserved: boolean;
  blocked: boolean;
  isMyReservation: boolean;
  isMyClinicReservation: boolean;
  coachName?: string;
  coachUnavailable?: boolean;
  isOpenPlay?: boolean;
  openPlaySlots?: number;
  currentPlayers?: number;
  maxOpenPlayers?: number;
  groupTotalPlayers?: number;
}

export interface TimeSlotBlockProps {
  court: Court;
  day: Date;
  block: TimeSlotBlockData;
  isTimeSlotInPast: (day: Date, timeOrHour: string | number) => boolean;
  handleTimeSlotClick: (court: Court, day: Date, startTime: string) => void;
  getFirstAvailableSlotForBlock: (court: Court, day: Date, startTime: string, endTime: string) => TimeSlot | null;
  legendFilters: {
    available: boolean;
    clinic: boolean;
    myReservations: boolean;
  };
  currentUserEmail: string;
  isMobile: boolean;
}

// Memoized component for time slot blocks to prevent unnecessary re-renders
const TimeSlotBlock = React.memo(({
  court,
  day,
  block,
  isTimeSlotInPast,
  handleTimeSlotClick,
  getFirstAvailableSlotForBlock,
  legendFilters,
  currentUserEmail,
  isMobile
}: TimeSlotBlockProps) => {
  const isPast = isTimeSlotInPast(day, block.startTime);

  // Compute duration in minutes for height calculation
  const [sh, sm] = block.startTime.split(':').map(Number);
  const [eh, em] = block.endTime.split(':').map(Number);
  const durationMins = (eh * 60 + em) - (sh * 60 + sm);
  const durationHours = durationMins / 60;
  const isMultiHour = durationMins > 60;

  // Format display label (strip trailing :00 for whole hours)
  const displayStart = sm === 0 ? `${sh}:00` : block.startTime;
  const displayEnd = em === 0 ? `${eh}:00` : block.endTime;
  const isOpenPlay = block.isOpenPlay && !block.isMyReservation;
  const maxPlayers = block.maxOpenPlayers || 8;
  const groupTotal = block.groupTotalPlayers ?? block.currentPlayers ?? 1;
  const slotsOpen = maxPlayers - groupTotal;

  return (
    <div
      key={`${court.id}-${day.toString()}-${block.startTime}-${block.endTime}`}
      className={cn(
        "text-sm sm:text-base text-center rounded transition-all duration-200 relative",
        isMobile ? "p-1" : "p-2",
        // Past slots should always be grey (check first, before other conditions)
        isPast
          ? "bg-gray-400/50 text-gray-600 border-2 border-gray-500/60 shadow-sm cursor-not-allowed opacity-60"
          // Coach unavailable styling - show but disable
          : block.coachUnavailable
          ? "bg-gray-400/50 text-gray-900 border-2 border-gray-500/60 shadow-sm cursor-not-allowed opacity-60"
          // My clinic reservation: purple fill with yellow border
          : block.isMyClinicReservation
          ? "bg-purple-500/50 text-purple-900 border-2 border-yellow-500/80 shadow-sm hover:bg-purple-500/60 cursor-pointer hover:scale-105"
          : block.isMyReservation
          ? "bg-purple-500/50 text-purple-900 border-2 border-purple-600/60 shadow-sm hover:bg-purple-500/60 cursor-pointer hover:scale-105"
          : block.isClinic
          ? "bg-yellow-500/50 text-yellow-900 border-2 border-yellow-600/60 shadow-sm hover:bg-yellow-500/60 cursor-pointer hover:scale-105"
          : block.available && !block.blocked && !block.reserved
          ? "bg-green-500/50 text-green-900 border-2 border-green-600/60 shadow-sm hover:bg-green-500/60 cursor-pointer hover:scale-105"
          : isOpenPlay
          ? "bg-yellow-400/50 text-yellow-900 border-2 border-yellow-500/60 shadow-sm hover:bg-yellow-400/60 cursor-pointer hover:scale-105"
          : block.reserved
          ? "bg-blue-500/50 text-blue-900 border-2 border-blue-600/60 shadow-sm hover:bg-blue-500/60 cursor-pointer hover:scale-105"
          : block.blocked
          ? "bg-gray-400/50 text-gray-900 border-2 border-gray-500/60 shadow-sm cursor-not-allowed"
          : "bg-gray-200 text-gray-500 border-2 border-gray-300/60 cursor-not-allowed",
        isMultiHour && "flex items-center justify-center",
        isMultiHour && !isPast && !block.coachUnavailable && block.isMyClinicReservation && "border-yellow-500/80 bg-gradient-to-br from-purple-500/50 to-purple-500/60 hover:from-purple-500/60 hover:to-purple-500/70",
        isMultiHour && !isPast && !block.coachUnavailable && block.isClinic && !block.isMyClinicReservation && "border-yellow-600/60 bg-gradient-to-br from-yellow-500/50 to-yellow-500/60 hover:from-yellow-500/60 hover:to-yellow-500/70",
        isMultiHour && !isPast && !block.coachUnavailable && block.isMyReservation && !block.isMyClinicReservation && "border-purple-600/60 bg-gradient-to-br from-purple-500/50 to-purple-500/60 hover:from-purple-500/60 hover:to-purple-500/70",
        isMultiHour && !isPast && !block.coachUnavailable && block.available && !block.isClinic && !block.isMyReservation && "border-green-600/60 bg-gradient-to-br from-green-500/50 to-green-500/60 hover:from-green-500/60 hover:to-green-500/70"
      )}
      style={{
        height: isMultiHour ? `${durationHours * (isMobile ? 4 : 3.5)}rem` : undefined,
        minHeight: isMultiHour ? undefined : isMobile ? "4rem" : "3.5rem",
        marginBottom: isMultiHour ? "0.5rem" : undefined
      }}
      onClick={() => {
        // Don't allow clicking past slots or coach-unavailable slots
        if (isPast || block.coachUnavailable) return;

        if (block.isClinic && isMultiHour) {
          const slot = getFirstAvailableSlotForBlock(court, day, block.startTime, block.endTime);
          if (slot) {
            handleTimeSlotClick(court, day, block.startTime);
          }
        } else {
          handleTimeSlotClick(court, day, block.startTime);
        }
      }}
      title={
        isPast
          ? `Past: ${displayStart} - ${displayEnd}`
          : block.coachUnavailable
          ? `Coach unavailable: ${displayStart} - ${displayEnd}`
          : block.isMyClinicReservation
          ? `My Reservation, Coaching session with ${block.coachName || 'Coach'}: ${displayStart} - ${displayEnd}`
          : block.isMyReservation
          ? `My Reservation: ${displayStart} - ${displayEnd}`
          : block.clinic
          ? `${block.clinic.name}: ${block.clinic.description} ($${block.clinic.price})`
          : `${displayStart} - ${displayEnd}`
      }
    >
      {isMultiHour ? (
        <div className="flex flex-col items-center justify-center h-full w-full overflow-hidden">
          <span className="font-bold text-xl sm:text-lg">{displayStart}</span>
          <span className="text-sm sm:text-xs opacity-75 font-medium">to</span>
          <span className="font-bold text-xl sm:text-lg">{displayEnd}</span>
          {block.isMyClinicReservation && block.clinic && (
            <div className="text-center mt-2">
              <span className="text-xs px-2 py-1 bg-purple-600/30 rounded-full border border-yellow-500/60 font-semibold flex items-center gap-1 justify-center">
                <GraduationCap className="h-3 w-3" />
                My Reservation
              </span>
              <div className="text-xs mt-1 text-purple-800 font-semibold">
                Coaching with {block.coachName || 'Coach'}
              </div>
            </div>
          )}
          {block.isClinic && block.clinic && !block.isMyClinicReservation && (
            <span
              className="text-[10px] mt-2 px-2 py-1 bg-yellow-600/30 rounded border border-yellow-600/40 font-semibold text-center break-words leading-tight max-w-full overflow-visible cursor-help"
              title={block.clinic.name}
            >
              {block.clinic.name}
            </span>
          )}
          {block.isMyReservation && !block.isMyClinicReservation && (
            <span className="text-sm mt-2 px-3 py-1 bg-purple-600/30 rounded-full border border-purple-600/40 font-semibold">
              My Reservation
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden">
          {block.isMyClinicReservation ? (
            <>
              <GraduationCap className="h-3 w-3 mb-0.5" />
              <span className="font-bold text-lg sm:text-xl">{displayStart}</span>
              <span className="text-[10px] font-semibold">My Session</span>
            </>
          ) : block.isClinic ? (
            <>
              <GraduationCap className="h-3 w-3 mb-0.5" />
              <span className="font-bold text-lg sm:text-xl">{displayStart}</span>
            </>
          ) : block.isMyReservation ? (
            <>
              <User className="h-3 w-3 mb-0.5" />
              <span className="font-bold text-lg sm:text-xl">{displayStart}</span>
            </>
          ) : isOpenPlay ? (
            <>
              <Users className="h-3 w-3 mb-0.5" />
              <span className="font-bold text-lg sm:text-xl">{displayStart}</span>
              <span className="text-[9px] font-semibold">
                {slotsOpen > 0 ? `${slotsOpen} open` : "Full"}
              </span>
            </>
          ) : block.reserved ? (
            <>
              <User className="h-3 w-3 mb-0.5" />
              <span className="font-bold text-lg sm:text-xl">{displayStart}</span>
            </>
          ) : block.blocked ? (
            <span className="font-bold text-lg sm:text-xl">{displayStart}</span>
          ) : block.available ? (
            <span className="font-bold text-lg sm:text-xl">{displayStart}</span>
          ) : (
            <span className="font-bold text-lg sm:text-xl text-gray-400">{displayStart}</span>
          )}
        </div>
      )}

      {block.isClinic && block.clinic && (
        <div className="absolute -top-1 -right-1">
          <div className="w-2 h-2 bg-yellow-500 border border-white"></div>
        </div>
      )}
      {block.isMyReservation && (
        <div className="absolute -top-1 -left-1">
          <div className="w-2 h-2 bg-purple-500 border border-white"></div>
        </div>
      )}
      {isOpenPlay && (
        <div className="absolute -top-1 -left-1">
          <div className="w-2 h-2 bg-yellow-500 border border-white rounded-full"></div>
        </div>
      )}
    </div>
  );
});

export default TimeSlotBlock;
