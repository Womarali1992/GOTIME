import { BaseRepository } from './base-repository';
import { UserSchema, CreateUserSchema } from '../validation/schemas';
import type { User, CreateUser } from '../validation/schemas';

export class UserRepository extends BaseRepository<User, CreateUser> {
  constructor(initialData: User[] = []) {
    super(UserSchema, CreateUserSchema, initialData);
  }

  protected getEntityPrefix(): string {
    return 'user';
  }

  findByEmail(email: string): User | undefined {
    return this.findOne(user => user.email === email);
  }

  findByPhone(phone: string): User | undefined {
    return this.findOne(user => user.phone === phone);
  }

  findByName(name: string): User[] {
    return this.findMany(user => 
      user.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  findByMembershipType(membershipType: 'basic' | 'premium' | 'admin'): User[] {
    return this.findMany(user => user.membershipType === membershipType);
  }

  findWithComments(): User[] {
    return this.findMany(user => user.comments && user.comments.length > 0);
  }

  findRecentUsers(limit: number = 10): User[] {
    return this.data
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  searchUsers(searchTerm: string): User[] {
    const term = searchTerm.toLowerCase();
    return this.findMany(user => 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.phone.includes(term)
    );
  }

  isEmailUnique(email: string, excludeId?: string): boolean {
    return !this.exists(user => user.email === email && user.id !== excludeId);
  }

  isPhoneUnique(phone: string, excludeId?: string): boolean {
    return !this.exists(user => user.phone === phone && user.id !== excludeId);
  }

  getAdminUsers(): User[] {
    return this.findByMembershipType('admin');
  }

  getPremiumUsers(): User[] {
    return this.findByMembershipType('premium');
  }

  getBasicUsers(): User[] {
    return this.findByMembershipType('basic');
  }

  getMembershipStats(): { basic: number; premium: number; admin: number; total: number } {
    const basic = this.count(user => user.membershipType === 'basic');
    const premium = this.count(user => user.membershipType === 'premium');
    const admin = this.count(user => user.membershipType === 'admin');
    
    return {
      basic,
      premium,
      admin,
      total: basic + premium + admin
    };
  }

  upgradeMembership(id: string, newMembershipType: 'basic' | 'premium' | 'admin'): User | undefined {
    return this.update(id, { membershipType: newMembershipType });
  }

  // Validation methods
  validateUserCreation(userData: CreateUser): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isEmailUnique(userData.email)) {
      errors.push('Email is already in use');
    }

    if (!this.isPhoneUnique(userData.phone)) {
      errors.push('Phone number is already in use');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateUserUpdate(id: string, userData: Partial<User>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (userData.email && !this.isEmailUnique(userData.email, id)) {
      errors.push('Email is already in use');
    }

    if (userData.phone && !this.isPhoneUnique(userData.phone, id)) {
      errors.push('Phone number is already in use');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
