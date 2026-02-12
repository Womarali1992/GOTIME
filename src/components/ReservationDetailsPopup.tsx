import React from "react";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { TimeSlot, Court, Reservation, Comment } from "@/lib/types";

export interface ReservationWithDetails {
  reservation: Reservation;
  timeSlot: TimeSlot;
  court: Court;
}

interface ReservationDetailsPopupProps {
  selectedReservation: ReservationWithDetails;
  reservationPopupRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onBackgroundClick: () => void;
  onEdit: () => void;
}

const ReservationDetailsPopup: React.FC<ReservationDetailsPopupProps> = ({
  selectedReservation,
  reservationPopupRef,
  onClose,
  onBackgroundClick,
  onEdit,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-4"
      onClick={onBackgroundClick}
    >
      <div
        ref={reservationPopupRef}
        className="bg-white rounded-lg w-full max-w-[90vw] sm:max-w-md max-h-[85vh] sm:max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-base sm:text-xl font-semibold text-foreground pr-2 flex-1">Reservation Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl flex-shrink-0 p-1"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <div className="border border-blue-200 rounded-lg p-3 sm:p-4 bg-blue-50">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-blue-800 text-base sm:text-lg">
                    {selectedReservation.court?.name}
                  </h3>
                  <p className="text-blue-600 text-sm sm:text-base">
                    {format(new Date(selectedReservation.timeSlot.date), "MMM d")}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700 font-medium text-sm sm:text-base">
                      {selectedReservation.timeSlot.startTime} - {selectedReservation.timeSlot.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700 text-sm sm:text-base">
                      {selectedReservation.court?.location}
                    </span>
                  </div>
                </div>

                <div className="border-t border-blue-200 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Player:</span>
                      <p className="text-blue-800">{selectedReservation.reservation.playerName}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Players:</span>
                      <p className="text-blue-800">{selectedReservation.reservation.players}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Email:</span>
                      <p className="text-blue-800 text-xs">{selectedReservation.reservation.playerEmail}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Phone:</span>
                      <p className="text-blue-800">{selectedReservation.reservation.playerPhone}</p>
                    </div>
                  </div>
                </div>

                {selectedReservation.reservation.isOpenPlay && (
                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-teal-600" />
                      <span className="font-medium text-teal-700 text-sm">Open Play</span>
                      <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                        {(() => {
                          const max = (selectedReservation.reservation as any).maxOpenPlayers || 8;
                          const current = selectedReservation.reservation.players || 1;
                          const remaining = max - current;
                          return remaining > 0 ? `${remaining} of ${max} spots open` : 'Full';
                        })()}
                      </span>
                    </div>
                    {selectedReservation.reservation.participants && selectedReservation.reservation.participants.filter(p => !p.isOrganizer).length > 0 && (
                      <div className="space-y-1">
                        <span className="text-blue-600 font-medium text-sm">Joined Players:</span>
                        {selectedReservation.reservation.participants.filter(p => !p.isOrganizer).map((p, i) => (
                          <p key={p.id || i} className="text-blue-800 text-sm pl-2">{p.name}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedReservation.reservation.comments && selectedReservation.reservation.comments.length > 0 && (
                  <div className="border-t border-blue-200 pt-3">
                    <span className="text-blue-600 font-medium">Comments:</span>
                    <div className="mt-2 space-y-2">
                      {selectedReservation.reservation.comments.map((comment: Comment, index: number) => (
                        <div key={comment.id || index} className="bg-blue-100 rounded p-2">
                          <p className="text-blue-800 text-sm">{comment.text}</p>
                          <p className="text-blue-600 text-xs mt-1">
                            - {comment.authorName} ({format(new Date(comment.createdAt), "MMM d, yyyy")})
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-blue-200 pt-3">
                  <p className="text-blue-600 text-xs">
                    Reserved on {format(new Date(selectedReservation.reservation.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={onEdit}
                className="w-full sm:w-auto"
              >
                Edit Reservation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetailsPopup;
