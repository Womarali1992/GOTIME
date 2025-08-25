import { UserRepository } from '../repositories/user-repository';
import type { User, CreateUser, Comment } from '../validation/schemas';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  // Core CRUD operations
  getAllUsers(): User[] {
    return this.userRepository.findAll();
  }

  getUserById(id: string): User | undefined {
    return this.userRepository.findById(id);
  }

  createUser(data: CreateUser): { success: boolean; user?: User; errors?: string[] } {
    try {
      // Validate user creation
      const validation = this.userRepository.validateUserCreation(data);
      
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const user = this.userRepository.create(data);
      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      };
    }
  }

  updateUser(id: string, data: Partial<User>): { success: boolean; user?: User; errors?: string[] } {
    try {
      // Validate user update
      const validation = this.userRepository.validateUserUpdate(id, data);
      
      if (!validation.isValid) {
        return { success: false, errors: validation.errors };
      }

      const user = this.userRepository.update(id, data);
      
      if (!user) {
        return { success: false, errors: ['User not found'] };
      }

      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'] 
      };
    }
  }

  deleteUser(id: string): { success: boolean; error?: string } {
    try {
      const deleted = this.userRepository.delete(id);
      return { success: deleted, error: deleted ? undefined : 'User not found' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Query methods
  findUserByEmail(email: string): User | undefined {
    return this.userRepository.findByEmail(email);
  }

  findUserByPhone(phone: string): User | undefined {
    return this.userRepository.findByPhone(phone);
  }

  searchUsers(searchTerm: string): User[] {
    return this.userRepository.searchUsers(searchTerm);
  }

  findUsersByName(name: string): User[] {
    return this.userRepository.findByName(name);
  }

  getUsersByMembershipType(membershipType: 'basic' | 'premium' | 'admin'): User[] {
    return this.userRepository.findByMembershipType(membershipType);
  }

  getUsersWithComments(): User[] {
    return this.userRepository.findWithComments();
  }

  getRecentUsers(limit: number = 10): User[] {
    return this.userRepository.findRecentUsers(limit);
  }

  // Membership management
  upgradeMembership(id: string, newMembershipType: 'basic' | 'premium' | 'admin'): { success: boolean; user?: User; error?: string } {
    try {
      const user = this.userRepository.upgradeMembership(id, newMembershipType);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  getAdminUsers(): User[] {
    return this.userRepository.getAdminUsers();
  }

  getPremiumUsers(): User[] {
    return this.userRepository.getPremiumUsers();
  }

  getBasicUsers(): User[] {
    return this.userRepository.getBasicUsers();
  }

  // DUPR Rating management
  updateUserDuprRating(id: string, duprRating: number): { success: boolean; user?: User; error?: string } {
    try {
      // Validate DUPR rating range
      if (duprRating < 1.0 || duprRating > 8.0) {
        return { success: false, error: 'DUPR rating must be between 1.0 and 8.0' };
      }

      const user = this.userRepository.update(id, { duprRating });
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      return { success: true, user };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  getUsersByDuprRange(minRating?: number, maxRating?: number): User[] {
    return this.userRepository.findAll().filter(user => {
      if (!user.duprRating) return false;
      if (minRating !== undefined && user.duprRating < minRating) return false;
      if (maxRating !== undefined && user.duprRating > maxRating) return false;
      return true;
    });
  }

  getUsersWithoutDuprRating(): User[] {
    return this.userRepository.findAll().filter(user => !user.duprRating);
  }

  getBeginnerUsers(): User[] {
    return this.getUsersByDuprRange(undefined, 2.99);
  }

  getIntermediateUsers(): User[] {
    return this.getUsersByDuprRange(3.0, 4.99);
  }

  getAdvancedUsers(): User[] {
    return this.getUsersByDuprRange(5.0);
  }

  // Comment management
  updateUserComments(userId: string, comments: Comment[]): { success: boolean; error?: string } {
    try {
      const user = this.userRepository.update(userId, { comments });
      return { success: !!user, error: user ? undefined : 'User not found' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  addCommentToUser(userId: string, comment: Omit<Comment, 'id' | 'createdAt'>): { success: boolean; error?: string } {
    try {
      const user = this.userRepository.findById(userId);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const newComment: Comment = {
        ...comment,
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...(user.comments || []), newComment];
      const updated = this.userRepository.update(userId, { comments: updatedComments });
      
      return { success: !!updated, error: updated ? undefined : 'Failed to add comment' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Analytics and reporting
  getMembershipStats(): { basic: number; premium: number; admin: number; total: number } {
    return this.userRepository.getMembershipStats();
  }

  getUserStats(): {
    totalUsers: number;
    usersWithComments: number;
    membershipDistribution: { basic: number; premium: number; admin: number };
    recentUserCount: number;
    duprDistribution: { withRating: number; withoutRating: number; beginner: number; intermediate: number; advanced: number };
  } {
    const membershipStats = this.getMembershipStats();
    const usersWithComments = this.getUsersWithComments().length;
    const recentUsers = this.getRecentUsers(30); // Last 30 users
    
    const usersWithRating = this.getAllUsers().filter(u => u.duprRating).length;
    const usersWithoutRating = this.getUsersWithoutDuprRating().length;
    const beginnerUsers = this.getBeginnerUsers().length;
    const intermediateUsers = this.getIntermediateUsers().length;
    const advancedUsers = this.getAdvancedUsers().length;

    return {
      totalUsers: membershipStats.total,
      usersWithComments,
      membershipDistribution: {
        basic: membershipStats.basic,
        premium: membershipStats.premium,
        admin: membershipStats.admin
      },
      recentUserCount: recentUsers.length,
      duprDistribution: {
        withRating: usersWithRating,
        withoutRating: usersWithoutRating,
        beginner: beginnerUsers,
        intermediate: intermediateUsers,
        advanced: advancedUsers
      }
    };
  }

  // Validation helpers
  isEmailAvailable(email: string, excludeUserId?: string): boolean {
    return this.userRepository.isEmailUnique(email, excludeUserId);
  }

  isPhoneAvailable(phone: string, excludeUserId?: string): boolean {
    return this.userRepository.isPhoneUnique(phone, excludeUserId);
  }

  validateUserData(userData: CreateUser): { isValid: boolean; errors: string[] } {
    return this.userRepository.validateUserCreation(userData);
  }

  validateUserUpdate(id: string, userData: Partial<User>): { isValid: boolean; errors: string[] } {
    return this.userRepository.validateUserUpdate(id, userData);
  }
}
