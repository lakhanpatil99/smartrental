import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Lock, LogOut, User, Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    const isDark = saved === null ? true : saved === 'true';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.displayName || user.email?.split('@')[0] || 'User');
    }
  }, [user]);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
      setIsDarkMode(false);
    } else {
      root.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
      setIsDarkMode(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign out');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { displayName }
      });
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  // Generate initials from email
  const initials = user?.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : 'U';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile & Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card className="flex flex-col items-center text-center p-6">
            <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
              {initials}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{displayName}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{user?.email || ''}</p>
            
            <Button 
              variant="outline" 
              className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10 dark:text-red-400"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Appearance</h3>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <span className="font-medium text-slate-700 dark:text-slate-300">Dark Mode</span>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span 
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`} 
                />
              </button>
            </div>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h3>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input 
                label="Full Name" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                icon={<User className="w-4 h-4" />} 
              />
              <Input label="Email Address" type="email" defaultValue={user?.email || ''} disabled icon={<Shield className="w-4 h-4" />} />
              <Button type="submit" variant="secondary" className="mt-2" isLoading={isUpdatingProfile}>Update Profile</Button>
            </form>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Change Password</h3>
            </div>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <Input 
                label="Current Password" type="password" required icon={<Lock className="w-4 h-4" />}
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Input 
                label="New Password" type="password" required icon={<Lock className="w-4 h-4" />}
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input 
                label="Confirm New Password" type="password" required icon={<Lock className="w-4 h-4" />}
                value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              <Button type="submit" isLoading={isSaving} className="mt-2">Change Password</Button>
            </form>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
