import { Button } from "@/components/ui/button";
import UserSearchForm from "@/components/UserSearchForm";
import type { User } from "@/lib/types";

interface UsersSectionProps {
  users: User[];
  onAddUser: () => void;
  onEditUserComments: (user: User) => void;
}

const UsersSection = ({ users, onAddUser, onEditUserComments }: UsersSectionProps) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Users
          </h2>
          <div className="text-sm text-muted-foreground mt-1 space-y-1">
            <div>Manage and search through all users</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span>Total: {users.length}</span>
              <span>•</span>
              <span>With DUPR: {users.filter((u) => u.duprRating).length}</span>
              <span>•</span>
              <span>Beginners: {users.filter((u) => u.duprRating && u.duprRating < 3.0).length}</span>
              <span>•</span>
              <span>
                Intermediate: {users.filter((u) => u.duprRating && u.duprRating >= 3.0 && u.duprRating < 5.0).length}
              </span>
              <span>•</span>
              <span>Advanced: {users.filter((u) => u.duprRating && u.duprRating >= 5.0).length}</span>
            </div>
          </div>
        </div>
        <Button className="bg-primary/90 hover:bg-primary/80 text-sm sm:text-base" onClick={onAddUser}>
          Add User
        </Button>
      </div>

      <UserSearchForm users={users} onEditComments={(user) => onEditUserComments(user)} />
    </>
  );
};

export default UsersSection;


