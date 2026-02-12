import { useUser } from '@/contexts/UserContext';

/**
 * Hook to check if the current user is an admin
 * Replaces scattered checks like: currentUser?.membershipType === 'admin'
 */
export function useIsAdmin(): boolean {
  const { currentUser } = useUser();
  return currentUser?.membershipType === 'admin';
}

/**
 * Hook to get admin status and user info together
 */
export function useAdminStatus() {
  const { currentUser, isAuthenticated } = useUser();
  const isAdmin = currentUser?.membershipType === 'admin';

  return {
    isAdmin,
    isAuthenticated,
    currentUser,
  };
}
