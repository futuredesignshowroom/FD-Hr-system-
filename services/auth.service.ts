// services/auth.service.ts - Authentication Service

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { FirestoreDB } from '@/lib/firestore';
import { User, UserRole } from '@/types/user';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(
    email: string,
    password: string,
    userData: {
      name: string;
      role: UserRole;
      department?: string;
    }
  ): Promise<User> {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your environment variables.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: userData.name,
        role: userData.role,
        department: userData.department,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save user to Firestore
      await FirestoreDB.addDocument('users', user);

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<FirebaseUser> {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your environment variables.');
    }
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Login with Google
   */
  static async signInWithGoogle(): Promise<FirebaseUser> {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your environment variables.');
    }
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore, if not create one
      const existingUser = await FirestoreDB.getDocument<User>(
        'users',
        userCredential.user.uid
      );
      
      if (!existingUser) {
        const newUser: User = {
          id: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || 'User',
          role: 'employee',
          photoURL: userCredential.user.photoURL || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await FirestoreDB.addDocument('users', newUser);
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw this.handleAuthError(error as AuthError);
    }
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check your environment variables.');
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current user from Firestore
   */
  static async getCurrentUser(uid: string): Promise<User | null> {
    try {
      const user = await FirestoreDB.getDocument<User>('users', uid);
      return user; // Returns null if document doesn't exist, throws only on actual errors
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error; // Rethrow actual errors so caller can handle retry
    }
  }

  /**
   * Handle Firebase auth errors
   */
  private static handleAuthError(error: AuthError): Error {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error('Email already in use');
      case 'auth/invalid-email':
        return new Error('Invalid email');
      case 'auth/weak-password':
        return new Error('Password is too weak');
      case 'auth/user-not-found':
        return new Error('User not found');
      case 'auth/wrong-password':
        return new Error('Wrong password');
      default:
        return new Error(error.message);
    }
  }
}
