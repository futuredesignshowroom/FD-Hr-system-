// app/(auth)/signup/page.tsx - Employee Signup Page

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const user = await AuthService.register(
        formData.email,
        formData.password,
        {
          name: formData.name,
          role: 'employee',
          department: formData.department,
        }
      );
      setUser(user);
      
      // Set auth cookies for middleware
      const cookieMaxAge = 7 * 24 * 60 * 60; // 7 days
      document.cookie = `auth-token=${user.id}; Max-Age=${cookieMaxAge}; path=/`;
      document.cookie = `user-role=${user.role}; Max-Age=${cookieMaxAge}; path=/`;
      document.cookie = `user-id=${user.id}; Max-Age=${cookieMaxAge}; path=/`;
      
      router.push('/dashboard-emp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);

    try {
      const firebaseUser = await AuthService.signInWithGoogle();
      const user = await AuthService.getCurrentUser(firebaseUser.uid);
      if (user) {
        setUser(user);
        
        // Set auth cookies for middleware
        const cookieMaxAge = 7 * 24 * 60 * 60; // 7 days
        document.cookie = `auth-token=${user.id}; Max-Age=${cookieMaxAge}; path=/`;
        document.cookie = `user-role=${user.role}; Max-Age=${cookieMaxAge}; path=/`;
        document.cookie = `user-id=${user.id}; Max-Age=${cookieMaxAge}; path=/`;
        
        router.push('/dashboard-emp');
      } else {
        // User was created in Firebase but profile fetch failed - shouldn't happen
        // but try again
        setError('Failed to load user profile. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-Up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center">Create Account</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Department</option>
            <option value="IT">IT</option>
            <option value="Accounts">Accounts</option>
            <option value="Administration">Administration</option>
            <option value="HR">HR</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Workers">Workers</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="my-4 flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-2 text-gray-500 text-sm">Or</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      <button
        onClick={handleGoogleSignUp}
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
        Sign up with Google
      </button>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Login
        </Link>
      </p>
    </div>
  );
}
