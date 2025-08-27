import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, X, User, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { User as UserType, Participant } from '@/lib/types';
import { useUser } from '@/contexts/UserContext';
import DuprRatingBadge from './DuprRatingBadge';

interface FriendSelectorProps {
  users: UserType[];
  selectedParticipants: Participant[];
  onParticipantsChange: (participants: Participant[]) => void;
  maxParticipants?: number;
  className?: string;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const FriendSelector: React.FC<FriendSelectorProps> = ({
  users,
  selectedParticipants,
  onParticipantsChange,
  maxParticipants = 4,
  className = "",
  isExpanded: externalExpanded,
  onExpandedChange
}) => {
  const { currentUser } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // Use external expanded state if provided, otherwise use internal state
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const setIsExpanded = onExpandedChange || setInternalExpanded;

  // Get user's friends from localStorage (matching UserSettings pattern)
  const [friends, setFriends] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) {
      const savedFriends = localStorage.getItem(`friends_${currentUser.email}`);
      if (savedFriends) {
        setFriends(JSON.parse(savedFriends));
      }
    }
  }, [currentUser]);

  // Filter users for search - exclude current user and already selected participants
  const searchResults = users.filter(user => {
    if (user.id === currentUser?.id) return false;
    if (selectedParticipants.some(p => p.id === user.id)) return false;
    
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).slice(0, 10); // Limit results to prevent UI overflow

  // Get friend users for quick selection
  const friendUsers = users.filter(user => 
    friends.includes(user.id) && 
    !selectedParticipants.some(p => p.id === user.id) &&
    user.id !== currentUser?.id
  );

  const addParticipant = (user: UserType) => {
    if (selectedParticipants.length >= maxParticipants) return;
    
    const newParticipant: Participant = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isOrganizer: false
    };

    onParticipantsChange([...selectedParticipants, newParticipant]);
    setSearchTerm('');
    setIsSearchVisible(false);
  };

  const removeParticipant = (participantId: string) => {
    onParticipantsChange(selectedParticipants.filter(p => p.id !== participantId));
  };

  const canAddMore = selectedParticipants.length < maxParticipants;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <Label className="text-sm font-medium">
          Playing Partners ({selectedParticipants.length}/{maxParticipants})
        </Label>
        <div className="flex items-center gap-2">
          {selectedParticipants.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedParticipants.length} selected
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Internal Add Friend Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="text-xs"
              disabled={!canAddMore}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Friend
            </Button>
          </div>

          {/* Selected Participants */}
          {selectedParticipants.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Selected players:</div>
              <div className="space-y-2">
                {selectedParticipants.map((participant) => {
                  const user = users.find(u => u.id === participant.id);
                  return (
                    <div key={participant.id} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                      <User className="h-3 w-3" />
                      <span className="text-xs font-medium">{participant.name}</span>
                      {user?.duprRating && (
                        <DuprRatingBadge rating={user.duprRating} size="sm" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(participant.id)}
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Add Friends */}
          {canAddMore && friendUsers.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Your friends:</div>
              <div className="grid grid-cols-2 gap-2">
                {friendUsers.slice(0, 6).map((user) => (
                  <Button
                    key={user.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addParticipant(user)}
                    className="text-xs h-8"
                  >
                    <User className="h-3 w-3 mr-1" />
                    {user.name}
                    {user.duprRating && (
                      <DuprRatingBadge rating={user.duprRating} size="sm" className="ml-1" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search Interface */}
          {isSearchVisible && canAddMore && (
            <Card className="border">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for players by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 text-sm"
                    />
                  </div>

                  {searchTerm && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        searchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                            onClick={() => addParticipant(user)}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="text-sm font-medium">{user.name}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs">
                                  {user.membershipType}
                                </Badge>
                                {user.duprRating && (
                                  <DuprRatingBadge rating={user.duprRating} size="sm" />
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          No players found matching "{searchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedParticipants.length === 0 && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
              You can add up to {maxParticipants - 1} friends to join you for this reservation. 
              Use the "Add Friend" button to search for players or quickly select from your friends list.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FriendSelector;
