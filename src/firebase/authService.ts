import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

export type UserRole = 'ADMIN' | 'EDITOR' | 'PRODUCER';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: string;
  lastLoginAt?: string;
}

const DRIVE_TOKEN_STORAGE_KEY = 'rrl_google_drive_token_v1';
const DRIVE_TOKEN_TTL_MS = 50 * 60 * 1000; // 50 minutes (Google OAuth access tokens last 60 mins)

function loadPersistedDriveToken(): string | null {
  try {
    const raw = sessionStorage.getItem(DRIVE_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token: string; expiresAt: number };
    if (!parsed.token || Date.now() > parsed.expiresAt) {
      sessionStorage.removeItem(DRIVE_TOKEN_STORAGE_KEY);
      return null;
    }
    return parsed.token;
  } catch {
    return null;
  }
}

function savePersistedDriveToken(token: string | null): void {
  try {
    if (!token) {
      sessionStorage.removeItem(DRIVE_TOKEN_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(
      DRIVE_TOKEN_STORAGE_KEY,
      JSON.stringify({
        token,
        expiresAt: Date.now() + DRIVE_TOKEN_TTL_MS,
      })
    );
  } catch {
    // ignore storage errors
  }
}

// Token cache for Google Workspace Drive API (backed by sessionStorage for Vercel reloads)
let cachedDriveAccessToken: string | null = loadPersistedDriveToken();

const googleDriveProvider = new GoogleAuthProvider();
googleDriveProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleDriveProvider.setCustomParameters({
  prompt: 'select_account',
});

const ROLE_STORAGE_KEY = 'rrl_active_user_role_v1';

function loadPersistedRole(): UserRole {
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    if (saved === 'ADMIN' || saved === 'EDITOR' || saved === 'PRODUCER') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  return 'ADMIN';
}

function savePersistedRole(role: UserRole): void {
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // ignore storage errors
  }
}

export const authService = {
  getPersistedRole(): UserRole {
    return loadPersistedRole();
  },

  // Listen to auth state changes
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, (user) => {
      if (!user || user.isAnonymous) {
        cachedDriveAccessToken = null;
        savePersistedDriveToken(null);
      } else if (!cachedDriveAccessToken) {
        cachedDriveAccessToken = loadPersistedDriveToken();
      }
      callback(user);
    });
  },

  getDriveAccessToken(): string | null {
    if (!cachedDriveAccessToken) {
      cachedDriveAccessToken = loadPersistedDriveToken();
    }
    return cachedDriveAccessToken;
  },

  setDriveAccessToken(token: string | null) {
    cachedDriveAccessToken = token;
    savePersistedDriveToken(token);
  },

  // Fetch or create user profile doc in Firestore
  async getUserProfile(user: User, fallbackRole?: UserRole): Promise<UserProfile> {
    const defaultRole = fallbackRole || loadPersistedRole();
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const resolvedRole = (data.role as UserRole) || defaultRole;
        savePersistedRole(resolvedRole);
        return {
          id: user.uid,
          email: user.email || data.email || 'anonymous@studio.local',
          displayName: user.displayName || data.displayName || 'Team Member',
          role: resolvedRole,
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
        };
      }

      // Create new profile doc
      const newProfile: UserProfile = {
        id: user.uid,
        email: user.email || `${user.uid.slice(0, 8)}@studio.local`,
        displayName: user.displayName || `Editor #${user.uid.slice(0, 4)}`,
        role: defaultRole,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, {
        ...newProfile,
        serverCreatedAt: serverTimestamp(),
      });

      savePersistedRole(defaultRole);
      return newProfile;
    } catch (err) {
      console.warn('Failed to fetch/save user profile from Firestore:', err);
      return {
        id: user.uid,
        email: user.email || 'offline@studio.local',
        displayName: user.displayName || 'Team Member',
        role: defaultRole,
      };
    }
  },

  // Sign up with Email & Password
  async register(email: string, pass: string, displayName: string, role: UserRole = 'ADMIN') {
    savePersistedRole(role);
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    return this.getUserProfile(cred.user, role);
  },

  // Sign in with Email & Password
  async login(email: string, pass: string) {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return this.getUserProfile(cred.user);
  },

  // Quick 1-Click Team Member Role Switch (Works with Google user or Local Session without requiring Anonymous Auth)
  async quickLoginAs(role: UserRole, customName?: string): Promise<UserProfile> {
    savePersistedRole(role);
    const displayName =
      customName || (role === 'ADMIN' ? 'หัวหน้าโปรดิวเซอร์ (Admin)' : 'ผู้ตัดต่อคลิป (Editor)');

    // 1. If already signed in with a Firebase user (e.g. Google), update their role in Firestore
    if (auth.currentUser) {
      const currentUser = auth.currentUser;
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(
          userDocRef,
          {
            id: currentUser.uid,
            email: currentUser.email || `${role.toLowerCase()}@studio.local`,
            displayName: currentUser.displayName || displayName,
            role,
            lastLoginAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Could not update role in Firestore users doc:', err);
      }

      return {
        id: currentUser.uid,
        email: currentUser.email || `${role.toLowerCase()}@studio.local`,
        displayName: currentUser.displayName || displayName,
        role,
        lastLoginAt: new Date().toISOString(),
      };
    }

    // 2. Try Anonymous Auth only if enabled; if restricted (auth/admin-restricted-operation), fallback cleanly to local session profile
    try {
      const cred = await signInAnonymously(auth);
      await updateProfile(cred.user, { displayName });
      const userDocRef = doc(db, 'users', cred.user.uid);
      await setDoc(
        userDocRef,
        {
          id: cred.user.uid,
          email: `${role.toLowerCase()}-${cred.user.uid.slice(0, 5)}@studio.local`,
          displayName,
          role,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return this.getUserProfile(cred.user, role);
    } catch {
      // Anonymous auth is disabled in Firebase Console (normal default) -> return instant session profile
      return {
        id: `session-${role.toLowerCase()}`,
        email: role === 'ADMIN' ? 'admin@studio.local' : 'editor@studio.local',
        displayName,
        role,
        lastLoginAt: new Date().toISOString(),
      };
    }
  },

  // Sign in with Google (OAuth with Drive Scope — Primary Firebase Auth Provider)
  async signInWithGoogle(
    role?: UserRole
  ): Promise<{ user: User; accessToken: string; profile: UserProfile }> {
    const targetRole = role || loadPersistedRole();
    const cred = await signInWithPopup(auth, googleDriveProvider);
    const googleCredential = GoogleAuthProvider.credentialFromResult(cred);
    const accessToken = googleCredential?.accessToken || '';
    cachedDriveAccessToken = accessToken;
    savePersistedDriveToken(accessToken);

    const profile = await this.getUserProfile(cred.user, targetRole);
    return { user: cred.user, accessToken, profile };
  },

  // Sign out
  async logout() {
    cachedDriveAccessToken = null;
    savePersistedDriveToken(null);
    await signOut(auth);
  },
};
