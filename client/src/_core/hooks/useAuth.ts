const mockUser = { id: 1, username: "Demo用户", email: "demo@tiktok-ai.com" };

export function useAuth(_options?: { redirectOnUnauthenticated?: boolean; redirectPath?: string }) {
  return {
    user: mockUser,
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: () => Promise.resolve(),
    logout: async () => {},
  };
}
