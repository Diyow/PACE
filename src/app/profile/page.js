'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  LockClosedIcon,
  ArrowPathIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  const [userData, setUserData] = useState({
    id: '',
    fullName: '',
    username: '', // Username is usually not editable by user
    email: '',
    phoneNumber: '',
    role: '',
    organizationName: '', // For organizers
  });
  const [initialUserData, setInitialUserData] = useState({}); // To track changes

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deletePasswordConfirm, setDeletePasswordConfirm] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const fetchProfileData = useCallback(async () => {
    if (status === 'authenticated') {
      setIsLoading(true);
      try {
        const response = await fetch('/api/profile');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch profile data.');
        }
        const data = await response.json();
        console.log("Fetched profile data from API:", data);
        setUserData({
            id: data.id || '',
            fullName: data.fullName || '',
            username: data.username || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            role: data.role || '',
            organizationName: data.organizationName || '',
        });
        setInitialUserData({ // Store initial fetched data
            fullName: data.fullName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || '',
            organizationName: data.organizationName || '',
        });
      } catch (error) {
        toast.error(error.message);
        console.error("Fetch profile error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [status]);

  useEffect(() => {
    if (status === 'loading') {
      return; // Wait until session status is resolved
    }
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile'); // Redirect if not logged in
      return;
    }
    fetchProfileData();
  }, [status, router, fetchProfileData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const hasProfileChanged = () => {
    return (
      userData.fullName !== initialUserData.fullName ||
      userData.email !== initialUserData.email ||
      userData.phoneNumber !== initialUserData.phoneNumber ||
      (userData.role === 'organizer' && userData.organizationName !== initialUserData.organizationName)
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!hasProfileChanged()) {
        toast.success('No changes to save.');
        return;
    }
    setIsUpdating(true);
    const toastId = toast.loading('Updating profile...');

    try {
      const payload = {
        fullName: userData.fullName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
      };
      if (userData.role === 'organizer') {
        payload.organizationName = userData.organizationName;
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }
      toast.success(data.message || 'Profile updated successfully!', { id: toastId });
      // Update session if email changed, as it might be used in UI
      if (userData.email !== session.user.email) {
          await updateSession({ user: { ...session.user, email: userData.email, name: userData.fullName } }); // Also update name if it's used in session
      } else if (userData.fullName !== session.user.name) {
           await updateSession({ user: { ...session.user, name: userData.fullName } });
      }
      setInitialUserData({ // Update initial data to current after successful save
          fullName: userData.fullName,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          organizationName: userData.organizationName,
      });

    } catch (error) {
      toast.error(error.message, { id: toastId });
      console.error("Update profile error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
        toast.error("New password must be at least 8 characters long.");
        return;
    }

    setIsChangingPassword(true);
    const toastId = toast.loading('Changing password...');
    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password.');
      }
      toast.success(data.message || 'Password changed successfully!', { id: toastId });
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast.error(error.message, { id: toastId });
      console.error("Change password error:", error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setIsDeletingAccount(true);
    const toastId = toast.loading('Deleting account...');
    try {
      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePasswordConfirm }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account.');
      }
      toast.success(data.message || 'Account deleted successfully. Signing out...', { id: toastId });
      setShowDeleteAccountModal(false);
      setDeletePasswordConfirm('');
      // Sign out and redirect
      await signOut({ redirect: false }); // Sign out without NextAuth redirecting
      router.push('/'); // Manually redirect to home
    } catch (error) {
      toast.error(error.message, { id: toastId });
      console.error("Delete account error:", error);
    } finally {
      setIsDeletingAccount(false);
    }
  };


  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ArrowPathIcon className="h-12 w-12 text-sky-500 animate-spin" />
        <p className="ml-3 text-sky-700">Loading Profile...</p>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session) {
    // This case should ideally be handled by the useEffect redirect,
    // but it's a good fallback.
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p className="text-xl text-gray-700">Please log in to view your profile.</p>
        </div>
    );
  }

  const inputFieldStyles = "w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 hover:border-gray-400 transition-colors text-sm";
  const labelStyles = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-sky-700">Your Profile</h1>
          <p className="mt-2 text-gray-600">Manage your account details and preferences.</p>
        </header>

        {/* Profile Information Form */}
        <form onSubmit={handleUpdateProfile} className="bg-white p-8 rounded-xl shadow-xl space-y-6 mb-10 border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 mb-6 flex items-center">
            <IdentificationIcon className="h-7 w-7 mr-2 text-sky-600" />
            Personal Information
          </h2>

          {/* Username (Read-only) */}
          <div className="relative">
            <label htmlFor="username" className={labelStyles}>Username</label>
            <div className="relative">
                <UserCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" id="username" name="username" value={userData.username} readOnly className={`${inputFieldStyles} bg-gray-100 cursor-not-allowed`} />
            </div>
            <p className="mt-1 text-xs text-gray-500">Your username cannot be changed.</p>
          </div>

          {/* Full Name */}
          <div className="relative">
            <label htmlFor="fullName" className={labelStyles}>Full Name</label>
            <div className="relative">
                <UserCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" id="fullName" name="fullName" value={userData.fullName} onChange={handleInputChange} className={inputFieldStyles} required />
            </div>
          </div>

          {/* Email */}
          <div className="relative">
            <label htmlFor="email" className={labelStyles}>Email Address</label>
            <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="email" id="email" name="email" value={userData.email} onChange={handleInputChange} className={inputFieldStyles} required />
            </div>
          </div>

          {/* Phone Number */}
          <div className="relative">
            <label htmlFor="phoneNumber" className={labelStyles}>Phone Number (Optional)</label>
            <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="tel" id="phoneNumber" name="phoneNumber" value={userData.phoneNumber} onChange={handleInputChange} className={inputFieldStyles} placeholder="+1234567890" />
            </div>
          </div>

          {/* Organization Name (for organizers) */}
          {userData.role === 'organizer' && (
            <div className="relative">
              <label htmlFor="organizationName" className={labelStyles}>Organization Name</label>
              <div className="relative">
                <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" id="organizationName" name="organizationName" value={userData.organizationName} onChange={handleInputChange} className={inputFieldStyles} />
              </div>
            </div>
          )}
          
          {/* Role (Read-only) */}
           <div className="relative">
            <label htmlFor="role" className={labelStyles}>Role</label>
             <div className="relative">
                <UserCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" id="role" name="role" value={userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} readOnly className={`${inputFieldStyles} bg-gray-100 cursor-not-allowed`} />
            </div>
          </div>


          <div className="pt-5">
            <button
              type="submit"
              disabled={isUpdating || !hasProfileChanged()}
              className="w-full flex justify-center items-center bg-sky-600 text-white py-2.5 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : null}
              {isUpdating ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Security Section */}
        <div className="bg-white p-8 rounded-xl shadow-xl space-y-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 border-b pb-3 mb-6 flex items-center">
                <KeyIcon className="h-7 w-7 mr-2 text-sky-600" />
                Security
            </h2>
            <button
                onClick={() => setShowChangePasswordModal(true)}
                className="w-full text-left text-sky-600 hover:text-sky-700 font-medium py-3 px-4 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors border border-sky-200 flex items-center justify-between"
            >
                <span>Change Password</span>
                <LockClosedIcon className="h-5 w-5" />
            </button>

            <div className="mt-8 pt-6 border-t border-gray-200">
                 <h3 className="text-xl font-semibold text-red-600 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="h-6 w-6 mr-2"/>
                    Danger Zone
                </h3>
                <button
                    onClick={() => setShowDeleteAccountModal(true)}
                    className="w-full text-left text-red-600 hover:text-red-700 font-medium py-3 px-4 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200 flex items-center justify-between"
                >
                    <span>Delete My Account</span>
                    <TrashIcon className="h-5 w-5" />
                </button>
                <p className="text-xs text-gray-500 mt-2">This action is permanent and cannot be undone.</p>
            </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleChangePassword} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md space-y-6">
            <h3 className="text-xl font-semibold text-sky-700 mb-1">Change Password</h3>
            <div className="relative">
              <label htmlFor="currentPassword" className={labelStyles}>Current Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputFieldStyles} required />
              </div>
            </div>
            <div className="relative">
              <label htmlFor="newPassword" className={labelStyles}>New Password</label>
               <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputFieldStyles} required />
              </div>
            </div>
            <div className="relative">
              <label htmlFor="confirmNewPassword" className={labelStyles}>Confirm New Password</label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="password" id="confirmNewPassword" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputFieldStyles} required />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3">
              <button type="button" onClick={() => {setShowChangePasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');}} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors" disabled={isChangingPassword}>
                Cancel
              </button>
              <button type="submit" disabled={isChangingPassword} className="px-5 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center">
                {isChangingPassword ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" /> : null}
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleDeleteAccount} className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md space-y-5">
            <h3 className="text-xl font-semibold text-red-700 mb-2 flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-red-500"/> Confirm Account Deletion
            </h3>
            <p className="text-sm text-gray-600">
              This action is irreversible. All your data, including event organizer details (if applicable), bookings, and tickets will be permanently removed.
            </p>
            <p className="text-sm text-gray-600">
                To confirm, please enter your current password.
            </p>
            <div className="relative">
              <label htmlFor="deletePasswordConfirm" className={labelStyles}>Current Password</label>
               <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="password" id="deletePasswordConfirm" value={deletePasswordConfirm} onChange={(e) => setDeletePasswordConfirm(e.target.value)} className={inputFieldStyles} required />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-3">
              <button type="button" onClick={() => {setShowDeleteAccountModal(false); setDeletePasswordConfirm('');}} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors" disabled={isDeletingAccount}>
                Cancel
              </button>
              <button type="submit" disabled={isDeletingAccount || !deletePasswordConfirm} className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 flex items-center">
                {isDeletingAccount ? <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" /> : null}
                {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
