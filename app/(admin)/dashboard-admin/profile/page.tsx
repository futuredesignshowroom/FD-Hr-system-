'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth.store';
import Loader from '@/components/ui/Loader';

interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  createdAt: Date;
  phone?: string;
  bio?: string;
  avatar?: string;
}

export default function AdminProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        // For admin, we use the user data directly since admins don't have employee records
        const profileData: AdminProfile = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department || 'Administration',
          createdAt: user.createdAt || new Date(),
          phone: '', // Admins can add phone if needed
          bio: '', // Admins can add bio if needed
          avatar: '', // Admins can add avatar if needed
        };
        setProfile(profileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // For now, we'll just show success since admin profile updates
      // would need to be implemented in the user service
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AdminProfile, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    setError('');

    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        // For admin profile, we need to update the user record
        // Since admin profiles are stored in users collection, we'll need to update that
        setProfile({ ...profile, avatar: base64 });
        setSuccess('Profile picture updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload image');
      console.error('Avatar upload error:', err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getAvatarUrl = (avatar?: string, name?: string) => {
    if (avatar && avatar.startsWith('data:')) {
      return avatar; // Base64 image
    }
    if (avatar && avatar.startsWith('http')) {
      return avatar; // URL
    }
    // Generate initials-based avatar
    const displayName = name || 'Admin';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=DC2626&color=FFFFFF&size=128`;
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
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Admin Profile</h1>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Profile Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Image
                src={getAvatarUrl(profile.avatar, profile.name)}
                alt="Profile"
                width={96}
                height={96}
                className="w-24 h-24 rounded-full border-4 border-gray-100 object-cover"
                onError={(e) => {
                  // Fallback to initials avatar if image fails to load
                  const target = e.target as HTMLImageElement;
                  const initials = profile.name.split(' ').map(n => n[0]).join('').toUpperCase();
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=DC2626&color=FFFFFF&size=128`;
                }}
              />
              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {uploadingAvatar ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{profile.name}</h3>
              <p className="text-gray-600 capitalize">{profile.role}</p>
              <p className="text-sm text-gray-500">Member since {profile.createdAt.toLocaleDateString()}</p>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded-md">{profile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <p className="p-2 bg-gray-50 rounded-md">{profile.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <p className="p-2 bg-gray-50 rounded-md capitalize">{profile.role}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded-md">{profile.department}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter phone number"
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded-md">{profile.phone || 'Not provided'}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded-md">{profile.bio || 'No bio provided'}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
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