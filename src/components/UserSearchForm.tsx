import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X, User, StickyNote } from 'lucide-react';
import { User as UserType } from '@/lib/types';
import DuprRatingBadge from './DuprRatingBadge';

interface UserSearchFormProps {
  users: UserType[];
  onUserSelect?: (user: UserType) => void;
  onEditComments?: (user: UserType) => void;
}

const UserSearchForm: React.FC<UserSearchFormProps> = ({ 
  users, 
  onUserSelect, 
  onEditComments 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [membershipFilter, setMembershipFilter] = useState<string>('all');
  const [duprFilter, setDuprFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'membershipType' | 'createdAt' | 'duprRating'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and search logic
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm);

      // Membership filter
      const matchesMembership = membershipFilter === 'all' || user.membershipType === membershipFilter;

      // DUPR filter
      const matchesDupr = duprFilter === 'all' || 
        (duprFilter === 'none' && !user.duprRating) ||
        (duprFilter === 'beginner' && user.duprRating && user.duprRating < 3.0) ||
        (duprFilter === 'intermediate' && user.duprRating && user.duprRating >= 3.0 && user.duprRating < 5.0) ||
        (duprFilter === 'advanced' && user.duprRating && user.duprRating >= 5.0);

      return matchesSearch && matchesMembership && matchesDupr;
    });

    // Sort users
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case 'membershipType':
          aValue = a.membershipType;
          bValue = b.membershipType;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'duprRating':
          aValue = a.duprRating || 0;
          bValue = b.duprRating || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, membershipFilter, duprFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchTerm('');
    setMembershipFilter('all');
    setDuprFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const hasActiveFilters = searchTerm !== '' || membershipFilter !== 'all' || duprFilter !== 'all' || sortBy !== 'name' || sortOrder !== 'asc';

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            User Search & Filter
          </CardTitle>
          <CardDescription>
            Search users by name, email, or phone number. Filter and sort results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Membership Filter */}
              <div className="space-y-2">
                <Label htmlFor="membership">Membership Type</Label>
                <Select value={membershipFilter} onValueChange={setMembershipFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All memberships" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* DUPR Rating Filter */}
              <div className="space-y-2">
                <Label htmlFor="duprFilter">DUPR Rating</Label>
                <Select value={duprFilter} onValueChange={setDuprFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="none">No Rating</SelectItem>
                    <SelectItem value="beginner">Beginner (&lt; 3.0)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (3.0 - 4.9)</SelectItem>
                    <SelectItem value="advanced">Advanced (5.0+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="membershipType">Membership</SelectItem>
                    <SelectItem value="duprRating">DUPR Rating</SelectItem>
                    <SelectItem value="createdAt">Join Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedUsers.length} of {users.length} users
          {hasActiveFilters && (
            <span className="ml-2">
              <Badge variant="secondary" className="text-xs">
                Filtered
              </Badge>
            </span>
          )}
        </div>
        
        {filteredAndSortedUsers.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {filteredAndSortedUsers.filter(u => u.comments && u.comments.length > 0).length} user{filteredAndSortedUsers.filter(u => u.comments && u.comments.length > 0).length !== 1 ? 's' : ''} with notes
          </div>
        )}
      </div>

      {/* Search Results */}
      {filteredAndSortedUsers.length === 0 ? (
        <Card className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm">
                {hasActiveFilters 
                  ? "Try adjusting your search criteria or clear the filters." 
                  : "No users match your search criteria."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredAndSortedUsers.map(user => (
            <Card 
              key={user.id} 
              className={`border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg shadow-primary/5 transition-all duration-200 ${
                onUserSelect ? 'cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02]' : ''
              }`}
              onClick={() => onUserSelect?.(user)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {user.name}
                    </CardTitle>
                    <CardDescription>
                      <div className="space-y-1 mt-2">
                        <div className="text-sm">{user.email}</div>
                        <div className="text-sm">{user.phone}</div>
                        <div className="text-xs text-muted-foreground">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={user.membershipType === 'premium' ? 'default' : user.membershipType === 'admin' ? 'secondary' : 'outline'}>
                      {user.membershipType}
                    </Badge>
                    {user.duprRating && (
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">DUPR:</div>
                        <DuprRatingBadge rating={user.duprRating} className="flex-col items-end gap-1" />
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.comments && user.comments.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StickyNote className="h-4 w-4" />
                        <span className="font-medium">Admin Comments:</span>
                      </div>
                      <span className="text-xs font-medium">
                        {user.comments.length} comment{user.comments.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xs text-yellow-700 mb-1">
                      Latest: {new Date(user.comments[user.comments.length - 1].createdAt).toLocaleDateString()}
                    </div>
                    <div className="line-clamp-2">
                      {user.comments[user.comments.length - 1].text}
                    </div>
                  </div>
                )}
                
                {onEditComments && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditComments(user);
                      }}
                      className="border-yellow-300 hover:bg-yellow-50 text-xs sm:text-sm"
                    >
                      <StickyNote className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{user.comments && user.comments.length > 0 ? `Edit Comments (${user.comments.length})` : 'Add Comments'}</span>
                      <span className="sm:hidden">Comments</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearchForm;
