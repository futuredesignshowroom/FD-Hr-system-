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
import { EmployeeService } from './employee.service';
import { Employee } from '@/types/employee';
import { LeaveConfigService } from './leave-config.service';

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
        department: userData.department || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save user to Firestore with explicit document ID
      await FirestoreDB.addDocument('users', user, firebaseUser.uid);

      // If user is employee, create employee record
      if (userData.role === 'employee') {
        const [firstName, ...lastNameParts] = userData.name.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        const employee: Employee = {
          id: '', // will be set by addDocument
          userId: firebaseUser.uid,
          employeeId: `EMP${firebaseUser.uid.slice(0, 8).toUpperCase()}`, // generate employeeId
          firstName,
          lastName,
          email: firebaseUser.email || '',
          department: userData.department || '',
          position: 'Employee',
          dateOfJoining: new Date(),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await EmployeeService.createEmployee(employee);

        // Initialize leave balances for the new employee
        await LeaveConfigService.initializeUserLeaveBalances(firebaseUser.uid);
      }

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
      const firebaseUser = userCredential.user;

      // Defensive: ensure employee record exists for employee users
      try {
        const currentUser = await this.getCurrentUser(firebaseUser.uid);
        if (currentUser && currentUser.role === 'employee') {
          try {
            await EmployeeService.getEmployeeProfile(firebaseUser.uid);
          } catch (err) {
            // If profile not found, create a basic employee profile
            const nameSource = currentUser.name || firebaseUser.displayName || 'User';
            const [firstName, ...lastNameParts] = nameSource.split(' ');
            const lastName = lastNameParts.join(' ') || '';

            const employee: Employee = {
              id: '',
              userId: firebaseUser.uid,
              employeeId: `EMP${firebaseUser.uid.slice(0, 8).toUpperCase()}`,
              firstName,
              lastName,
              email: currentUser.email || firebaseUser.email || '',
              department: currentUser.department || '',
              position: 'Employee',
              dateOfJoining: new Date(),
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            await EmployeeService.createEmployee(employee);
          }
        }
      } catch (err) {
        console.warn('Error ensuring employee profile on login:', err);
      }

      return firebaseUser;
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

        // Create employee record for new employee user
        const [firstName, ...lastNameParts] = newUser.name.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        const employee: Employee = {
          id: '',
          userId: userCredential.user.uid,
          employeeId: `EMP${userCredential.user.uid.slice(0, 8).toUpperCase()}`,
          firstName,
          lastName,
          email: newUser.email,
          department: '', // default empty
          position: 'Employee',
          dateOfJoining: new Date(),
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await EmployeeService.createEmployee(employee);
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
      console.log(`[Auth] Getting current user with uid: ${uid}`);
      const user = await FirestoreDB.getDocument<User>('users', uid);
      console.log(`[Auth] User fetched:`, user ? 'found' : 'not found');
      return user; // Returns null if document doesn't exist, throws only on actual errors
    } catch (error) {
      console.error('[Auth] Error getting current user:', error);
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
        return new Error('Invalid email address');
      case 'auth/weak-password':
        return new Error('Password is too weak (minimum 6 characters)');
      case 'auth/user-not-found':
        return new Error('Email not found. Please sign up first.');
      case 'auth/wrong-password':
        return new Error('Incorrect password');
      case 'auth/invalid-credential':
        return new Error('Invalid email or password. Please check and try again.');
      case 'auth/operation-not-allowed':
        return new Error('Email/password sign-in is not enabled');
      case 'auth/too-many-requests':
        return new Error('Too many failed login attempts. Please try again later.');
      default:
        return new Error(error.message || 'Authentication failed');
    }
  }
}
