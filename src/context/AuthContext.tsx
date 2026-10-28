import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService, UserProfile, UserRole } from '../firebase/authService';
import { testFirestoreConnection } from '../firebase/config';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isEditor: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role?: UserRole) => Promise<void>;
  quickLoginAsRole: (role: UserRole, customName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Test initial connection
    testFirestoreConnection();

    // Listen to Firebase Auth state
    const unsubscribe = authService.onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await authService.getUserProfile(user);
          setUserProfile(profile);
        } catch (err) {
          console.warn('Failed to load user profile:', err);
        }
      } else {
        // Automatically provide a convenient default guest session as Editor if not logged in
        // so user isn't blocked by an annoying mandatory login screen
        setUserProfile({
          id: 'guest-editor',
          email: 'editor@studio.local',
          displayName: 'ผู้ตัดต่อคลิป (Team Editor)',
          role: 'EDITOR',
        });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const profile = await authService.login(email, pass);
      setUserProfile(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole = 'EDITOR'
  ) => {
    setIsLoading(true);
    try {
      const profile = await authService.register(email, pass, name, role);
      setUserProfile(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAsRole = async (role: UserRole, customName?: string) => {
    setIsLoading(true);
    try {
      const profile = await authService.quickLoginAs(role, customName);
      setUserProfile(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUserProfile({
      id: 'guest-editor',
      email: 'guest@studio.local',
      displayName: 'ผู้ตัดต่อ (Guest)',
      role: 'EDITOR',
    });
  };

  const currentRole: UserRole = userProfile?.role || 'EDITOR';
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'PRODUCER';
  const isEditor = currentRole === 'EDITOR' || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role: currentRole,
        isAdmin,
        isEditor,
        isLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithEmail,
        registerWithEmail,
        quickLoginAsRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
