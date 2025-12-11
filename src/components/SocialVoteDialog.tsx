import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar, Clock, Users, CheckCircle2, Lock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Social } from "@/lib/validation/schemas";

interface SocialVoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  social: Social | null;
  currentUserId: string;
  onVote: (timeSlotId: string) => void;
  onLock?: (timeSlotId: string) => void;
  onUnlock?: () => void;
  onDelete?: () => void;
  onBookNow?: () => void;
  isBooked?: boolean;
}

const SocialVoteDialog = ({
  isOpen,
  onClose,
  social,
  currentUserId,
  onVote,
  onLock,
  onUnlock,
  onDelete,
  onBookNow,
  isBooked = false,
}: SocialVoteDialogProps) => {
  if (!social) return null;

  const userVote = social.timeSlots.find(slot => slot.votes.includes(currentUserId));
  const topSlot = [...social.timeSlots].sort((a, b) => b.votes.length - a.votes.length)[0];
  const isHost = social.hostId === currentUserId;
  const isLocked = !!social.lockedTimeSlotId;
  const lockedSlot = isLocked
    ? social.timeSlots.find(s => s.id === social.lockedTimeSlotId)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="gradient-card gradient-border neon-border max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="gradient-text text-xl">{social.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-1 mt-2">
                <Users className="h-4 w-4" />
                Hosted by {social.hostName}
              </DialogDescription>
            </div>
            {isLocked && (
              <Badge variant="default" className="ml-2">
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(social.date), "EEEE, MMM d")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {social.timeWindowStart} - {social.timeWindowEnd}
              </span>
            </div>
          </div>

          {isLocked && lockedSlot ? (
            <>
              <div className="p-4 rounded-lg border-2 border-primary/20" style={{ backgroundColor: '#FFF7E6' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-muted-foreground">Final Time</div>
                    <div className="text-2xl font-bold text-primary">{lockedSlot.time}</div>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <div className="text-sm text-muted-foreground mt-3">
                  {lockedSlot.votes.length} {lockedSlot.votes.length === 1 ? 'player has' : 'players have'} voted for this time
                </div>
              </div>

              {isBooked ? (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    Court Booked!
                  </div>
                  <p className="text-sm text-green-600 mt-1">This social has a reservation</p>
                </div>
              ) : onBookNow ? (
                <Button
                  onClick={onBookNow}
                  className="w-full gradient-border gradient-hover"
                  size="lg"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Court Now
                </Button>
              ) : null}

              {isHost && onUnlock && !isBooked && (
                <Button
                  onClick={onUnlock}
                  variant="outline"
                  className="w-full"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock & Edit Time
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="text-sm font-semibold">Vote for your preferred time:</div>
                <div className="grid grid-cols-2 gap-3">
                  {social.timeSlots.map((slot) => {
                    const isUserVote = userVote && slot.id === userVote.id;
                    const isTopVote = topSlot && slot.id === topSlot.id && slot.votes.length > 0;

                    return (
                      <Button
                        key={slot.id}
                        variant={isUserVote ? "default" : "outline"}
                        size="lg"
                        onClick={() => onVote(slot.id)}
                        className={`relative h-auto py-4 ${isTopVote ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                      >
                        <div className="flex flex-col items-center w-full gap-1">
                          <div className="text-xl font-bold">{slot.time}</div>
                          <div className="flex items-center gap-1 text-xs">
                            <Users className="h-3 w-3" />
                            <span>{slot.votes.length} votes</span>
                          </div>
                        </div>
                        {isUserVote && (
                          <CheckCircle2 className="absolute top-2 right-2 h-4 w-4" />
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {isHost && topSlot && topSlot.votes.length > 0 && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => onLock && onLock(topSlot.id)}
                    className="w-full gradient-border gradient-hover"
                    size="lg"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Lock in {topSlot.time} ({topSlot.votes.length} votes)
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    This will finalize the time and remove other options from the schedule
                  </p>
                </div>
              )}
            </>
          )}

          {/* Delete button for host */}
          {isHost && onDelete && (
            <div className="pt-4 border-t mt-4">
              <Button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this social? This action cannot be undone.')) {
                    onDelete();
                  }
                }}
                variant="destructive"
                className="w-full"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Social
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SocialVoteDialog;
