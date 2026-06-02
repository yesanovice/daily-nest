import { create } from 'zustand';
import { User, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase/config';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false, error: null }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // user state will be updated by onAuthStateChanged listener
    } catch (error: any) {
      console.error("Google Login failed:", error);
      set({ error: error.message || "Failed to login with Google", isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut(auth);
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    } catch (error: any) {
      console.error("Logout failed:", error);
      set({ error: error.message || "Failed to logout", isLoading: false });
    }
  },
  
  initializeAuth: () => {
    set({ isLoading: true });
    const unsubscribe = onAuthStateChanged(auth, 
      (user) => {
        set({ user, isAuthenticated: !!user, isLoading: false, error: null });
      },
      (error) => {
        console.error("Auth state change error:", error);
        set({ error: error.message, isLoading: false });
      }
    );
    return unsubscribe; // Return the unsubscribe function for cleanup
  }
}));
