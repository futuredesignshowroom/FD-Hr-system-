// app/(auth)/login/page.tsx - Login Page

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUid, setLastUid] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'admin') {
      setUserRole('admin');
    } else {
      setUserRole('employee');
    }
  }, [searchParams]);

  const loginUser = async (uid: string) => {
    try {
      const user = await AuthService.getCurrentUser(uid);
      if (user) {
        console.log('[Login] User found, setting user and redirecting...');
        setUser(user);
        setLastUid(null);
        
        // Set auth cookies for middleware
        const cookieMaxAge = 7 * 24 * 60 * 60; // 7 days
        document.cookie = `auth-token=${uid}; Max-Age=${cookieMaxAge}; path=/`;
        document.cookie = `user-role=${user.role}; Max-Age=${cookieMaxAge}; path=/`;
        document.cookie = `user-id=${user.id}; Max-Age=${cookieMaxAge}; path=/`;
        
        // Give store and cookies a moment to update before redirecting
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const redirectPath = user.role === 'admin' ? '/dashboard-admin' : '/dashboard-emp';
        console.log('[Login] Redirecting to:', redirectPath);
        router.push(redirectPath);
      } else {
        setError('User profile not found. Please sign up first or contact an administrator.');
        setLastUid(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user profile';
      setError(errorMessage);
      setLastUid(uid);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIsRetrying(false);

    try {
      const firebaseUser = await AuthService.login(email, password);
      setLastUid(firebaseUser.uid);
      await loginUser(firebaseUser.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!lastUid) return;
    setIsRetrying(true);
    setError('');
    setLoading(true);

    try {
      await loginUser(lastUid);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setIsRetrying(false);

    try {
      const firebaseUser = await AuthService.signInWithGoogle();
      setLastUid(firebaseUser.uid);
      await loginUser(firebaseUser.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className={`text-3xl font-bold mb-6 text-center ${
          userRole === 'admin' ? 'text-green-600' : 'text-blue-600'
        }`}>
          {userRole === 'admin' ? 'Admin Login' : 'Employee Login'}
        </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          <p>{error}</p>
          {lastUid && (
            <button
              onClick={handleRetry}
              disabled={loading}
              className="mt-2 text-red-700 underline hover:text-red-800 disabled:opacity-50"
            >
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent ${
              userRole === 'admin' ? 'focus:ring-green-500' : 'focus:ring-blue-500'
            }`}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent ${
              userRole === 'admin' ? 'focus:ring-green-500' : 'focus:ring-blue-500'
            }`}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg disabled:opacity-50 font-medium text-white ${
            userRole === 'admin'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>

      <div className="my-4 flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-2 text-gray-500 text-sm">Or</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-white border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </button>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <Link
          href={userRole === 'admin' ? '/admin-signup' : '/signup'}
          className={`font-medium ${
            userRole === 'admin' ? 'text-green-600 hover:text-green-700' : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          {userRole === 'admin' ? 'Register as Admin' : 'Sign up'}
        </Link>
      </p>

      <p className="mt-2 text-center text-sm text-gray-600">
        {userRole === 'admin' ? (
          <>
            Login as{' '}
            <Link href="/login?role=employee" className="text-blue-600 hover:text-blue-700 font-medium">
              Employee
            </Link>
          </>
        ) : (
          <>
            Login as{' '}
            <Link href="/login?role=admin" className="text-green-600 hover:text-green-700 font-medium">
              Admin
            </Link>
          </>
        )}
      </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
