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
  signInWithGoogle: () => Promise<string>;
  driveAccessToken: string | null;
  isGoogleDriveConnected: boolean;
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
        const savedRole = authService.getPersistedRole();
        setUserProfile({
          id: `session-${savedRole.toLowerCase()}`,
          email: savedRole === 'ADMIN' ? 'admin@studio.local' : 'editor@studio.local',
          displayName:
            savedRole === 'ADMIN'
              ? 'หัวหน้าโปรดิวเซอร์ (Admin)'
              : 'ผู้ตัดต่อคลิป (Team Editor)',
          role: savedRole,
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
    role: UserRole = 'ADMIN'
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

  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(authService.getDriveAccessToken());

  const signInWithGoogle = async (): Promise<string> => {
    setIsLoading(true);
    try {
      const { user, accessToken, profile } = await authService.signInWithGoogle();
      setCurrentUser(user);
      setUserProfile(profile);
      setDriveAccessToken(accessToken);
      return accessToken;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setDriveAccessToken(null);
    const savedRole = authService.getPersistedRole();
    setUserProfile({
      id: `session-${savedRole.toLowerCase()}`,
      email: savedRole === 'ADMIN' ? 'admin@studio.local' : 'editor@studio.local',
      displayName:
        savedRole === 'ADMIN' ? 'หัวหน้าโปรดิวเซอร์ (Admin)' : 'ผู้ตัดต่อ (Editor)',
      role: savedRole,
    });
  };

  const currentRole: UserRole = userProfile?.role || 'EDITOR';
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'PRODUCER';
  const isEditor = currentRole === 'EDITOR' || isAdmin;
  const isGoogleDriveConnected = Boolean(driveAccessToken && currentUser && !currentUser.isAnonymous);

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
        signInWithGoogle,
        driveAccessToken,
        isGoogleDriveConnected,
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
