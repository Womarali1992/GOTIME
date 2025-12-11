import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, CheckCircle2, Lock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import CreateSocialForm from "./CreateSocialForm";
import type { Social } from "@/lib/validation/schemas";

interface SocialsSectionProps {
  socials: Social[];
  currentUserId: string;
  currentUserName: string;
  courts: Array<{ id: string; name: string }>;
  onCreateSocial: (data: any) => void;
  onVoteForTimeSlot: (socialId: string, timeSlotId: string) => void;
  onLockTimeSlot: (socialId: string, timeSlotId: string) => void;
  onUnlockTimeSlot?: (socialId: string) => void;
  onDeleteSocial?: (socialId: string) => void;
}

const SocialsSection = ({
  socials,
  currentUserId,
  currentUserName,
  courts,
  onCreateSocial,
  onVoteForTimeSlot,
  onLockTimeSlot,
  onUnlockTimeSlot,
  onDeleteSocial,
}: SocialsSectionProps) => {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const getUserVote = (social: Social): string | null => {
    const votedSlot = social.timeSlots.find(slot => slot.votes.includes(currentUserId));
    return votedSlot ? votedSlot.id : null;
  };

  const getTopVotedSlot = (social: Social) => {
    if (social.timeSlots.length === 0) return null;
    const sorted = [...social.timeSlots].sort((a, b) => b.votes.length - a.votes.length);
    return sorted[0];
  };

  const isHost = (social: Social) => social.hostId === currentUserId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Looking for Players</h2>
          <p className="text-muted-foreground mt-1">Join or create a social game</p>
        </div>
        <Button
          onClick={() => setIsCreateFormOpen(true)}
          className="gradient-border gradient-hover"
        >
          Create Social
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {socials.map((social) => {
          const userVote = getUserVote(social);
          const topSlot = getTopVotedSlot(social);
          const lockedSlot = social.lockedTimeSlotId
            ? social.timeSlots.find(s => s.id === social.lockedTimeSlotId)
            : null;

          return (
            <Card
              key={social.id}
              className="gradient-card gradient-border neon-border"
              style={{
                backgroundColor: lockedSlot ? '#FFF7E6' : undefined
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="gradient-text">{social.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" />
                      Hosted by {social.hostName}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {lockedSlot && (
                      <Badge variant="default">
                        <Lock className="h-3 w-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                    {isHost(social) && onDeleteSocial && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this social? This action cannot be undone.')) {
                            onDeleteSocial(social.id);
                          }
                        }}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(social.date), "EEEE, MMM d, yyyy")}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {social.timeWindowStart} - {social.timeWindowEnd}
                  </span>
                </div>

                {lockedSlot ? (
                  <>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-primary">Final Time</div>
                          <div className="text-lg font-bold">{lockedSlot.time}</div>
                        </div>
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {lockedSlot.votes.length} {lockedSlot.votes.length === 1 ? 'player' : 'players'}
                      </div>
                    </div>
                    {isHost(social) && onUnlockTimeSlot && (
                      <Button
                        onClick={() => onUnlockTimeSlot(social.id)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                      >
                        Unlock & Edit Time
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Vote for a time:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {social.timeSlots.map((slot) => {
                          const isUserVote = slot.id === userVote;
                          const isTopVote = topSlot && slot.id === topSlot.id && slot.votes.length > 0;

                          return (
                            <Button
                              key={slot.id}
                              variant={isUserVote ? "default" : "outline"}
                              size="sm"
                              onClick={() => onVoteForTimeSlot(social.id, slot.id)}
                              className={`relative ${isTopVote ? 'ring-2 ring-primary' : ''}`}
                            >
                              <div className="flex flex-col items-center w-full">
                                <div className="font-semibold">{slot.time}</div>
                                <div className="text-xs flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {slot.votes.length}
                                </div>
                              </div>
                              {isUserVote && (
                                <CheckCircle2 className="absolute top-1 right-1 h-3 w-3" />
                              )}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          // Clear vote by voting for empty
                          if (userVote) {
                            // In a real app, we'd have a clearVote method
                            // For now, this is informational
                          }
                        }}
                      >
                        I'm flexible with any time
                      </Button>
                    </div>

                    {isHost(social) && topSlot && topSlot.votes.length > 0 && (
                      <Button
                        onClick={() => onLockTimeSlot(social.id, topSlot.id)}
                        className="w-full gradient-border gradient-hover"
                        size="sm"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Lock in {topSlot.time} ({topSlot.votes.length} votes)
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {socials.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No socials yet</h3>
          <p className="text-muted-foreground mb-4">
            Create the first social to find players!
          </p>
          <Button
            onClick={() => setIsCreateFormOpen(true)}
            className="gradient-border gradient-hover"
          >
            Create Social
          </Button>
        </div>
      )}

      <CreateSocialForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        onSave={onCreateSocial}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        courts={courts}
      />
    </div>
  );
};

export default SocialsSection;
