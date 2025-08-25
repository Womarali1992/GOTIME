import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Users, Search, UserPlus, UserMinus, Calendar } from "lucide-react";
import { useDataService } from "@/hooks/use-data-service";
import { DuprRatingBadge } from "@/components/DuprRatingBadge";
import { User as UserType } from "@/lib/types";

interface UserSettingsProps {
  currentUserEmail?: string;
}

const UserSettings = ({ currentUserEmail = "john@example.com" }: UserSettingsProps) => {
  const { users, userService } = useDataService();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'friends'>('profile');
  const [searchTerm, setSearchTerm] = useState("");
  const [friends, setFriends] = useState<string[]>([]);

  // Find current user
  const currentUser = users.find(user => user.email === currentUserEmail);

  // Mock friends functionality - in real app this would be stored in user data
  useEffect(() => {
    // Load friends from localStorage or initialize empty
    const savedFriends = localStorage.getItem(`friends_${currentUserEmail}`);
    if (savedFriends) {
      setFriends(JSON.parse(savedFriends));
    }
  }, [currentUserEmail]);

  const saveFriends = (newFriends: string[]) => {
    setFriends(newFriends);
    localStorage.setItem(`friends_${currentUserEmail}`, JSON.stringify(newFriends));
  };

  const addFriend = (userId: string) => {
    if (!friends.includes(userId)) {
      const newFriends = [...friends, userId];
      saveFriends(newFriends);
    }
  };

  const removeFriend = (userId: string) => {
    const newFriends = friends.filter(id => id !== userId);
    saveFriends(newFriends);
  };

  // Filter users for friend search
  const searchResults = users.filter(user => 
    user.id !== currentUser?.id && // Exclude current user
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const friendUsers = users.filter(user => friends.includes(user.id));

  if (!currentUser) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Not Found</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-muted-foreground">Please sign in to view your profile settings.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('profile')}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
          <Button
            variant={activeTab === 'friends' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('friends')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-2" />
            Friends ({friendUsers.length})
          </Button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg font-semibold">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{currentUser.name}</h3>
                <p className="text-muted-foreground">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={
                    currentUser.membershipType === 'premium' ? 'default' :
                    currentUser.membershipType === 'admin' ? 'destructive' : 'secondary'
                  }>
                    {currentUser.membershipType.charAt(0).toUpperCase() + currentUser.membershipType.slice(1)}
                  </Badge>
                  {currentUser.duprRating && (
                    <DuprRatingBadge rating={currentUser.duprRating} />
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Profile Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={currentUser.name} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={currentUser.email} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={currentUser.phone} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="dupr">DUPR Rating</Label>
                    <Input 
                      id="dupr" 
                      value={currentUser.duprRating ? currentUser.duprRating.toString() : 'Not rated'} 
                      readOnly 
                    />
                  </div>
                </div>
                <div>
                  <Label>Member Since</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Booking Window:</strong> You can view and book time slots up to {
                    // userService doesn't expose dataService; use useDataService accessor instead
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    (userService as any).dataService?.getTimeSlotVisibilityPeriod?.() ?? "2_weeks"
                      .replace('_', ' ')
                      .replace('weeks', 'weeks')
                      .replace('week', 'week')
                  } in advance</p>
                  <p className="text-muted-foreground">
                    This setting is configured by the facility administrator and applies to all users.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* DUPR Rating Info */}
            {currentUser.duprRating && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <DuprRatingBadge rating={currentUser.duprRating} />
                    DUPR Rating Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Current Rating:</strong> {currentUser.duprRating}</p>
                    <p><strong>Skill Level:</strong> {
                      currentUser.duprRating >= 6.0 ? 'Expert' :
                      currentUser.duprRating >= 4.0 ? 'Advanced' :
                      currentUser.duprRating >= 3.0 ? 'Intermediate' : 'Beginner'
                    }</p>
                    <p className="text-muted-foreground">
                      DUPR (Dynamic Universal Pickleball Rating) is the official rating system 
                      that provides the most accurate and only global rating for all pickleball players.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div className="space-y-4">
            {/* Search for Friends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Friends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchTerm && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {user.duprRating && (
                              <DuprRatingBadge rating={user.duprRating} size="sm" />
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={friends.includes(user.id) ? "destructive" : "default"}
                          onClick={() => friends.includes(user.id) ? removeFriend(user.id) : addFriend(user.id)}
                        >
                          {friends.includes(user.id) ? (
                            <>
                              <UserMinus className="h-3 w-3 mr-1" />
                              Remove
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-3 w-3 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                    {searchResults.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No users found matching "{searchTerm}"
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Friends List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Friends ({friendUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {friendUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    You haven't added any friends yet. Use the search above to find and add friends!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {friendUsers.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {friend.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{friend.name}</p>
                            <p className="text-sm text-muted-foreground">{friend.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {friend.membershipType}
                              </Badge>
                              {friend.duprRating && (
                                <DuprRatingBadge rating={friend.duprRating} size="sm" />
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFriend(friend.id)}
                        >
                          <UserMinus className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserSettings;
