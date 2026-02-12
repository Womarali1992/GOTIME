import React from "react";
import { format } from "date-fns";
import { TimeSlot, Court, Reservation, User } from "@/lib/types";

interface MyReservationsModalProps {
  reservations: Reservation[];
  timeSlots: TimeSlot[];
  courts: Court[];
  currentUserEmail: string;
  currentUser: User | null;
  myReservationsModalRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onBackgroundClick: () => void;
}

const MyReservationsModal: React.FC<MyReservationsModalProps> = ({
  reservations,
  timeSlots,
  courts,
  currentUserEmail,
  currentUser,
  myReservationsModalRef,
  onClose,
  onBackgroundClick,
}) => {
  const myReservations = reservations.filter(
    (res) =>
      res.playerEmail === currentUserEmail ||
      (currentUser?.id && (res as any).createdById === currentUser.id)
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-4"
      onClick={onBackgroundClick}
    >
      <div
        ref={myReservationsModalRef}
        className="bg-white rounded-lg w-full max-w-[90vw] sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-base sm:text-xl font-semibold text-foreground pr-2 flex-1">
              My Reservations
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl flex-shrink-0 p-1"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {myReservations.map((reservation) => {
              const timeSlot = timeSlots.find(
                (ts) => ts.id === reservation.timeSlotId
              );
              const court = courts.find((c) => c.id === reservation.courtId);
              const date = timeSlot ? new Date(timeSlot.date) : new Date();

              return (
                <div
                  key={reservation.id}
                  className="border border-purple-200 rounded-lg p-3 sm:p-4 bg-purple-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-purple-800 text-sm sm:text-base">
                        {court?.name} - {format(date, "MMM d")}
                      </h3>
                      <p className="text-purple-600 text-sm">
                        {timeSlot?.startTime} - {timeSlot?.endTime}
                      </p>
                      <p className="text-xs sm:text-sm text-purple-500">
                        {reservation.players} player
                        {reservation.players !== 1 ? "s" : ""}
                        {reservation.participants &&
                          reservation.participants.length > 1 && (
                            <span className="ml-2 text-xs">
                              (You +{" "}
                              {reservation.participants.length - 1} friend
                              {reservation.participants.length - 1 !== 1
                                ? "s"
                                : ""}
                              )
                            </span>
                          )}
                      </p>
                    </div>
                    <div className="w-4 h-4 bg-purple-500/20 border border-purple-500/30 rounded"></div>
                  </div>
                </div>
              );
            })}

            {myReservations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>You don't have any reservations yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyReservationsModal;
