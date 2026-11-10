import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  authService,
  loadPersistedDriveTokenPayload,
  UserProfile,
  UserRole,
} from '../firebase/authService';
import { firestoreService } from '../firebase/firestoreService';
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
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(() =>
    authService.getDriveAccessToken()
  );

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

  // Real-time Cloud Sync for Google Drive OAuth Token (50-minute valid window across tabs & devices)
  useEffect(() => {
    let expiryTimeout: ReturnType<typeof setTimeout> | null = null;

    const scheduleExpiry = (expiresAt: number) => {
      if (expiryTimeout) clearTimeout(expiryTimeout);
      const remainingMs = expiresAt - Date.now();
      if (remainingMs <= 0) {
        authService.setDriveAccessToken(null, { syncToCloud: false });
        setDriveAccessToken(null);
        return;
      }
      expiryTimeout = setTimeout(() => {
        authService.setDriveAccessToken(null, { syncToCloud: false });
        setDriveAccessToken(null);
      }, remainingMs);
    };

    const unsubDriveAuth = firestoreService.subscribeGoogleDriveAuth(
      (cloudAuth) => {
        const now = Date.now();
        const localPayload = loadPersistedDriveTokenPayload();

        if (cloudAuth && cloudAuth.token && cloudAuth.expiresAt > now) {
          // Valid token on Cloud -> sync to localStorage and state on this machine
          authService.setDriveAccessToken(cloudAuth.token, {
            expiresAt: cloudAuth.expiresAt,
            connectedEmail: cloudAuth.connectedEmail,
            syncToCloud: false,
          });
          setDriveAccessToken(cloudAuth.token);
          scheduleExpiry(cloudAuth.expiresAt);
        } else if (localPayload && localPayload.token && localPayload.expiresAt > now) {
          // Valid token in local browser -> auto-upload to Cloud so other devices receive it
          authService.setDriveAccessToken(localPayload.token, {
            expiresAt: localPayload.expiresAt,
            connectedEmail: localPayload.connectedEmail,
            syncToCloud: true,
          });
          setDriveAccessToken(localPayload.token);
          scheduleExpiry(localPayload.expiresAt);
        } else {
          // Both expired or empty
          authService.setDriveAccessToken(null, { syncToCloud: false });
          setDriveAccessToken(null);
        }
      },
      (err) => {
        console.warn('Google Drive auth Cloud subscription warning:', err);
      }
    );

    return () => {
      unsubDriveAuth();
      if (expiryTimeout) clearTimeout(expiryTimeout);
    };
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
  // Connected if a valid (non-expired) driveAccessToken is available locally or via Cloud Sync
  const isGoogleDriveConnected = Boolean(driveAccessToken);

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
