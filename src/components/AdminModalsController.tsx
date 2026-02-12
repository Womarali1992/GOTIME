import EditCourtForm from "@/components/EditCourtForm";
import ScheduleCourtForm from "@/components/ScheduleCourtForm";
import AddUserForm from "@/components/AddUserForm";
import AddCoachForm from "@/components/AddCoachForm";
import AddClinicForm from "@/components/AddClinicForm";
import AddUserToReservationForm from "@/components/AddUserToReservationForm";
import EditReservationDialog from "@/components/EditReservationDialog";
import CommentForm from "@/components/CommentForm";
import type { Court, TimeSlot, User, Clinic, Reservation, Comment as AppComment } from "@/lib/types";

interface ReservationCommentContext {
  id: string;
  comments: AppComment[];
  playerName: string;
  playerEmail: string;
  date?: string;
  time?: string;
  court?: string;
}

interface TimeSlotCommentContext {
  id: string;
  comments: AppComment[];
  date: string;
  time: string;
  court?: string;
}

interface AdminModalsControllerProps {
  // Edit/Schedule Court
  editingCourt: Court | any | null;
  onCloseEditCourt: () => void;
  onSaveEditCourt: (courtData: any) => void;
  schedulingCourt: Court | any | null;
  onCloseScheduleCourt: () => void;
  onSaveScheduleCourt: (scheduleData: any) => void;

  // Add entities
  showAddUser: boolean;
  onCloseAddUser: () => void;
  onSaveAddUser: (userData: any) => void;
  showAddCoach: boolean;
  onCloseAddCoach: () => void;
  onSaveAddCoach: (coachData: any) => void;
  showAddClinic: boolean;
  onCloseAddClinic: () => void;
  onSaveAddClinic: (clinicData: any) => void;

  // Add user to reservation
  showAddUserToReservation: boolean;
  onCloseAddUserToReservation: () => void;
  onSaveAddUserToReservation: (reservationData: any) => void;


  // Edit reservation
  editingReservation: Reservation | null;
  onCloseEditReservation: () => void;
  onSaveEditReservation: (reservationId: string, updates: any) => Promise<void>;
  onDeleteReservation?: (reservationId: string) => Promise<void>;

  timeSlots: TimeSlot[];
  users: User[];
  clinics: Clinic[];
  courts: Court[];
  preSelectedTimeSlot: string;

  // Comments forms
  editingReservationComments: ReservationCommentContext | null;
  onCloseReservationComments: () => void;
  onSaveReservationComments: (comments: AppComment[]) => void;

  editingUserComments: (User & { comments?: AppComment[] }) | null;
  onCloseUserComments: () => void;
  onSaveUserComments: (comments: AppComment[]) => void;

  editingTimeSlotComments: TimeSlotCommentContext | null;
  onCloseTimeSlotComments: () => void;
  onSaveTimeSlotComments: (comments: AppComment[]) => void;
}

const AdminModalsController = ({
  editingCourt,
  onCloseEditCourt,
  onSaveEditCourt,
  schedulingCourt,
  onCloseScheduleCourt,
  onSaveScheduleCourt,
  showAddUser,
  onCloseAddUser,
  onSaveAddUser,
  showAddCoach,
  onCloseAddCoach,
  onSaveAddCoach,
  showAddClinic,
  onCloseAddClinic,
  onSaveAddClinic,
  showAddUserToReservation,
  onCloseAddUserToReservation,
  onSaveAddUserToReservation,
  editingReservation,
  onCloseEditReservation,
  onSaveEditReservation,
  onDeleteReservation,
  timeSlots,
  users,
  clinics,
  courts,
  preSelectedTimeSlot,
  editingReservationComments,
  onCloseReservationComments,
  onSaveReservationComments,
  editingUserComments,
  onCloseUserComments,
  onSaveUserComments,
  editingTimeSlotComments,
  onCloseTimeSlotComments,
  onSaveTimeSlotComments,
}: AdminModalsControllerProps) => {
  return (
    <>
      {editingCourt && (
        <EditCourtForm
          court={editingCourt}
          isOpen={!!editingCourt}
          onClose={onCloseEditCourt}
          onSave={onSaveEditCourt}
        />
      )}

      {schedulingCourt && (
        <ScheduleCourtForm
          court={schedulingCourt}
          isOpen={!!schedulingCourt}
          onClose={onCloseScheduleCourt}
          onSave={onSaveScheduleCourt}
        />
      )}

      {showAddUser && (
        <AddUserForm isOpen={showAddUser} onClose={onCloseAddUser} onSave={onSaveAddUser} />
      )}

      {showAddCoach && (
        <AddCoachForm isOpen={showAddCoach} onClose={onCloseAddCoach} onSave={onSaveAddCoach} />
      )}

      {showAddClinic && (
        <AddClinicForm isOpen={showAddClinic} onClose={onCloseAddClinic} onSave={onSaveAddClinic} />
      )}

      {showAddUserToReservation && (
        <AddUserToReservationForm
          isOpen={showAddUserToReservation}
          onClose={onCloseAddUserToReservation}
          onSave={onSaveAddUserToReservation}
          timeSlots={timeSlots}
          users={users}
          clinics={clinics}
          courts={courts}
          preSelectedTimeSlot={preSelectedTimeSlot}
        />
      )}


      {editingReservation && (
        <EditReservationDialog
          isOpen={!!editingReservation}
          onClose={onCloseEditReservation}
          onSave={onSaveEditReservation}
          onDelete={onDeleteReservation}
          reservation={editingReservation}
        />
      )}

      {editingReservationComments && (
        <CommentForm
          isOpen={!!editingReservationComments}
          onClose={onCloseReservationComments}
          onSave={onSaveReservationComments}
          currentComments={editingReservationComments.comments || []}
          title="Edit Reservation Comments"
          description="Add or update admin comments for this reservation. These comments are only visible to administrators."
          type="reservation"
          data={{
            name: editingReservationComments.playerName,
            email: editingReservationComments.playerEmail,
            date: editingReservationComments.date,
            time: editingReservationComments.time,
            court: editingReservationComments.court,
          }}
        />
      )}

      {editingUserComments && (
        <CommentForm
          isOpen={!!editingUserComments}
          onClose={onCloseUserComments}
          onSave={onSaveUserComments}
          currentComments={editingUserComments.comments || []}
          title="Edit User Comments"
          description="Add or update admin comments for this user. These comments are only visible to administrators."
          type="user"
          data={{
            name: editingUserComments.name,
            email: editingUserComments.email,
            membershipType: editingUserComments.membershipType,
          }}
        />
      )}

      {editingTimeSlotComments && (
        <CommentForm
          isOpen={!!editingTimeSlotComments}
          onClose={onCloseTimeSlotComments}
          onSave={onSaveTimeSlotComments}
          currentComments={editingTimeSlotComments.comments || []}
          title="Edit Time Slot Comments"
          description="Add or update admin comments for this time slot. These comments are only visible to administrators."
          type="timeSlot"
          data={{
            name: "Time Slot",
            date: editingTimeSlotComments.date,
            time: editingTimeSlotComments.time,
            court: editingTimeSlotComments.court,
          }}
        />
      )}
    </>
  );
};

export default AdminModalsController;


