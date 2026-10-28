import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
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

export const authService = {
  // Listen to auth state changes
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Fetch or create user profile doc in Firestore
  async getUserProfile(user: User, fallbackRole: UserRole = 'EDITOR'): Promise<UserProfile> {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          id: user.uid,
          email: user.email || data.email || 'anonymous@studio.local',
          displayName: user.displayName || data.displayName || 'Team Member',
          role: (data.role as UserRole) || fallbackRole,
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
        };
      }

      // Create new profile doc
      const newProfile: UserProfile = {
        id: user.uid,
        email: user.email || `${user.uid.slice(0, 8)}@studio.local`,
        displayName: user.displayName || `Editor #${user.uid.slice(0, 4)}`,
        role: fallbackRole,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      await setDoc(userDocRef, {
        ...newProfile,
        serverCreatedAt: serverTimestamp(),
      });

      return newProfile;
    } catch (err) {
      console.warn('Failed to fetch/save user profile from Firestore:', err);
      return {
        id: user.uid,
        email: user.email || 'offline@studio.local',
        displayName: user.displayName || 'Team Member',
        role: fallbackRole,
      };
    }
  },

  // Sign up with Email & Password
  async register(email: string, pass: string, displayName: string, role: UserRole = 'EDITOR') {
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

  // Quick 1-Click Team Member Login (Anonymous with assigned Role)
  async quickLoginAs(role: UserRole, customName?: string) {
    const cred = await signInAnonymously(auth);
    const displayName = customName || (role === 'ADMIN' ? 'หัวหน้าทีม (Admin)' : 'ผู้ตัดต่อคลิป (Editor)');
    await updateProfile(cred.user, { displayName });
    
    // Update role in Firestore profile
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
  },

  // Sign out
  async logout() {
    await signOut(auth);
  },
};
