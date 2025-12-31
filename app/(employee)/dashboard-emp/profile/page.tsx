'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import { EmployeeService } from '@/services/employee.service';
import Loader from '@/components/ui/Loader';

interface EmployeeProfile {
  id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  dateOfJoining: Date;
  dateOfBirth?: Date;
  address?: string;
  bio?: string;
  avatar?: string;
  joinDate: string;
}

export default function EmployeeProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const data = await EmployeeService.getEmployeeProfile(user.id);
        const profileData = {
          ...data,
          name: `${data.firstName} ${data.lastName}`,
          joinDate: data.dateOfJoining.toISOString().split('T')[0],
        };
        setProfile(profileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const [firstName, ...lastNameParts] = profile.name.split(' ');
      const lastName = lastNameParts.join(' ');

      const updateData = {
        ...profile,
        firstName,
        lastName,
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : undefined,
        dateOfJoining: new Date(profile.joinDate),
      };

      await EmployeeService.updateEmployeeProfile(profile.id, updateData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof EmployeeProfile, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  if (loading) return <Loader />;

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 lg:p-8 text-white">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-blue-100">Manage your personal information and preferences</p>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8 mb-8">
          {/* Avatar */}
          <div className="relative">
            <Image
              src={profile.avatar || "https://via.placeholder.com/120"}
              alt="Profile"
              width={128}
              height={128}
              className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-4 border-gray-100"
            />
            {isEditing && (
              <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{profile.name}</h2>
            <p className="text-lg text-gray-600 mb-1">{profile.position}</p>
            <p className="text-gray-500 mb-1">{profile.department} Department</p>
            <p className="text-sm text-gray-500">Employee ID: {profile.employeeId}</p>
            <p className="text-sm text-gray-500">Joined: {new Date(profile.joinDate).toLocaleDateString()}</p>
          </div>

          {/* Action Button */}
          <div className="flex space-x-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
          {isEditing ? (
            <textarea
              value={profile.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
          ) : (
            <p className="text-gray-700 bg-gray-50 rounded-lg p-4 min-h-[100px]">
              {profile.bio || 'No bio added yet.'}
            </p>
          )}
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg px-4 py-3">{profile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg px-4 py-3">{profile.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg px-4 py-3">{profile.phone || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={profile.dateOfBirth ? profile.dateOfBirth.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                  {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              {isEditing ? (
                <textarea
                  value={profile.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg px-4 py-3 min-h-[80px]">
                  {profile.address || 'Not provided'}
                </p>
              )}
            </div>
          </div>

          {/* Read-only fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
              <p className="text-gray-900 bg-gray-50 rounded-lg px-4 py-3">{profile.employeeId}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <p className="text-gray-900 bg-gray-50 rounded-lg px-4 py-3">{profile.department}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
              <p className="text-gray-900 bg-gray-50 rounded-lg px-4 py-3">{profile.position}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Join Date</label>
              <p className="text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                {new Date(profile.joinDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
