"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardSidebar from "@/components/dashboard-sidebar";
import { 
  User, 
  Settings, 
  Shield, 
  Save,
  Trash2,
  Check,
  X,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { handleSuccess, handleError, AppError, ErrorType } from "@/lib/error-handler";
import { getUserSubscription } from "@/lib/stripe";
import { getSubscriptionLimits } from "@/lib/subscription-utils";
import { motion } from "framer-motion";
import { SkeletonPage } from "@/components/skeleton-loader";


interface FormData {
  firstName: string;
  lastName: string;
}

function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: (user?.unsafeMetadata?.firstName as string) || user?.firstName || '',
    lastName: (user?.unsafeMetadata?.lastName as string) || user?.lastName || '',
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [subscriptionLimits, setSubscriptionLimits] = useState<any>(null);

  // Initialize form data and subscription data when user loads
  useEffect(() => {
    if (user && isLoaded) {
      const firstName = user.unsafeMetadata?.firstName as string || user.firstName || '';
      const lastName = user.unsafeMetadata?.lastName as string || user.lastName || '';
      
      setFormData({
        firstName,
        lastName,
      });

      // Get subscription data
      const subscription = getUserSubscription(user);
      const limits = getSubscriptionLimits(user);
      
      setSubscriptionData(subscription);
      setSubscriptionLimits(limits);
    }
  }, [user, isLoaded]);

  // Function to refresh subscription data
  const refreshSubscriptionData = useCallback(async (showToast = true) => {
    if (user) {
      try {
        await user.reload();
        const subscription = getUserSubscription(user);
        const limits = getSubscriptionLimits(user);
        
        setSubscriptionData(subscription);
        setSubscriptionLimits(limits);
        
        if (showToast) {
          toast.success('Profile data refreshed');
        }
      } catch (error) {
        if (showToast) {
          toast.error('Failed to refresh profile data');
        }
      }
    }
  }, [user]);


  // Check for successful payment and refresh subscription data
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');
    
    if (sessionId && user) {
      setTimeout(() => {
        refreshSubscriptionData();
        toast.success('🎉 Payment successful! Your subscription has been updated.');
      }, 1000);
    } else if (canceled === 'true') {
      toast.info('Payment was canceled. You can try again anytime.');
    }
  }, [searchParams, user, refreshSubscriptionData]);

  // Check if form has changes - compare with unsafeMetadata
  useEffect(() => {
    if (user && isLoaded) {
      const currentFirstName = user.unsafeMetadata?.firstName as string || user.firstName || '';
      const currentLastName = user.unsafeMetadata?.lastName as string || user.lastName || '';
      
      const hasFormChanges = 
        formData.firstName.trim() !== currentFirstName.trim() ||
        formData.lastName.trim() !== currentLastName.trim();
      
      setHasChanges(hasFormChanges);
    }
  }, [formData, user, isLoaded]);


  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!user || !hasChanges) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Validate data before sending - compare with unsafeMetadata
      const currentFirstName = user.unsafeMetadata?.firstName as string || user.firstName || '';
      const currentLastName = user.unsafeMetadata?.lastName as string || user.lastName || '';
      
      const updateData: any = {};
      
      if (formData.firstName.trim() !== currentFirstName.trim()) {
        updateData.firstName = formData.firstName.trim();
      }
      
      if (formData.lastName.trim() !== currentLastName.trim()) {
        updateData.lastName = formData.lastName.trim();
      }

      if (Object.keys(updateData).length === 0) {
        handleSuccess(
          "No changes to save",
          "Your profile is already up to date"
        );
        setHasChanges(false);
        return;
      }

      // Use unsafeMetadata since direct name updates are not allowed
      const metadataUpdate = {
        unsafeMetadata: {
          ...user.unsafeMetadata,
          firstName: updateData.firstName !== undefined ? updateData.firstName : user.unsafeMetadata?.firstName,
          lastName: updateData.lastName !== undefined ? updateData.lastName : user.unsafeMetadata?.lastName,
        }
      };
      
      await user.update(metadataUpdate);
      await user.reload();
      
      // Update our local form data to match the server (from unsafeMetadata)
      setFormData({
        firstName: user.unsafeMetadata?.firstName as string || '',
        lastName: user.unsafeMetadata?.lastName as string || '',
      });
      
      // Trigger navbar refresh
      window.dispatchEvent(new CustomEvent('subscriptionUpdated'));
      
      handleSuccess(
        "Profile updated successfully",
        "Your changes have been saved and will persist"
      );
      setHasChanges(false);
    } catch (error: any) {
      // More specific error handling
      if (error.code === 'user_update_failed') {
        handleError(new AppError(ErrorType.AUTHENTICATION_FAILED, error));
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        handleError(new AppError(ErrorType.NETWORK_ERROR, error));
      } else {
        handleError(new AppError(ErrorType.UNKNOWN_ERROR, error));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChanges = () => {
    if (user) {
      setFormData({
        firstName: user.unsafeMetadata?.firstName as string || user.firstName || '',
        lastName: user.unsafeMetadata?.lastName as string || user.lastName || '',
      });
      setHasChanges(false);
      handleSuccess("Changes discarded", "Form reset to original values");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmationText = "DELETE";
    const confirmation = prompt(
      `This action cannot be undone. All your data will be permanently deleted.\n\nType "${confirmationText}" to confirm:`
    );
    
    if (confirmation !== confirmationText) {
      if (confirmation !== null) {
        handleError(new AppError(ErrorType.UNKNOWN_ERROR, new Error('Invalid confirmation')));
      }
      return;
    }
    
    setIsLoading(true);
    try {
      // Delete user account using Clerk's API
      await user?.delete();
      
      handleSuccess(
        "Account deleted successfully",
        "Your account and all data have been permanently removed"
      );
      
      // Redirect to home page after deletion
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Failed to delete account:', error);
      handleError(new AppError(ErrorType.UNKNOWN_ERROR, error as Error));
    } finally {
      setIsLoading(false);
    }
  };




  if (!isLoaded) {
    return (
      <>
        <DashboardSidebar />
        <SkeletonPage type="profile" />
      </>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardSidebar />
        <div className="lg:pl-64 pt-16 pb-20">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 shadow-lg border border-white/10 text-center"
            >
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                <User className="h-10 w-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Authentication Required</h2>
              <p className="text-gray-400 mb-8 text-lg">
                Please sign in to access your profile settings
              </p>
              <Link href="/">
                <button className="bg-white hover:bg-gray-100 text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300">
                  Go Home
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <DashboardSidebar />
      
      <div className="lg:pl-64 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
            <p className="text-gray-400">
              Manage your account information and preferences
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Sidebar - Profile Overview */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/10 sticky top-32"
              >
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-400/20 border-2 border-yellow-400/30 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                    {user.firstName?.[0] || user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {(user.unsafeMetadata?.firstName as string) || user.firstName || 'User'} {(user.unsafeMetadata?.lastName as string) || user.lastName || ''}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">{user.emailAddresses[0]?.emailAddress}</p>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    user.emailAddresses[0]?.verification?.status === 'verified' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    <Check className="w-3 h-3 mr-1" />
                    {user.emailAddresses[0]?.verification?.status === 'verified' ? 'Verified' : 'Unverified'}
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-sm text-gray-400">Member Since</span>
                    <span className="text-sm font-medium text-white">{new Date(user.createdAt!).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-white/10">
                    <span className="text-sm text-gray-400">Last Active</span>
                    <span className="text-sm font-medium text-white">{new Date(user.lastSignInAt!).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-400">Account Type</span>
                    <span className="text-sm font-medium text-white">Individual</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Account Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/10"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Account Information</h3>
                    <p className="text-sm text-gray-400">Update your personal details</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                      <input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter your first name"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                      <input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Enter your last name"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {hasChanges && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                        <span className="text-sm text-yellow-400 font-medium">
                          You have unsaved changes
                        </span>
                      </div>
                      <button
                        onClick={handleResetChanges}
                        className="text-yellow-400 hover:text-yellow-300 text-sm font-medium px-3 py-1 rounded-lg hover:bg-yellow-400/10 transition-all duration-200"
                      >
                        <X className="h-4 w-4 inline mr-1" />
                        Discard
                      </button>
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      defaultValue={user.emailAddresses[0]?.emailAddress || ''}
                      disabled
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Email changes must be done through your account provider
                    </p>
                  </div>
                </div>
              </motion.div>


              {/* Danger Zone */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white/5 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-red-500/30"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                    <Shield className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Danger Zone</h3>
                    <p className="text-sm text-gray-400">Irreversible actions that affect your account</p>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Delete Account</h4>
                  <p className="text-xs text-gray-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-end mt-8"
          >
            <div className="flex gap-3">
              {hasChanges && (
                <button
                  onClick={handleResetChanges}
                  disabled={isSaving}
                  className="px-4 py-2 border border-white/20 text-gray-300 rounded-lg font-medium transition-all duration-200 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Discard
                </button>
              )}
              <button
                onClick={handleSaveProfile}
                disabled={!hasChanges || isSaving}
                className="px-6 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/50 text-yellow-400 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ProfilePage />
    </Suspense>
  );
} 