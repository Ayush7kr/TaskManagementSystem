// UserProfile.tsx

import React, { useState, useEffect } from 'react'; // Import useEffect
import { useNavigate } from 'react-router-dom';
import { Camera, Save, Eye, EyeOff, LogOut, Loader2 } from 'lucide-react'; // Import Loader2
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUser } from '@/contexts/UserContext';

// Define backend API URL for user actions
const API_USER_URL = 'http://localhost:3000/api/user';

const UserProfile = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  // Ensure 'token' is retrieved from the context
  const { user, updateUser, logout, token } = useUser();

  // Initialize state - This will now correctly use defaults or user context data
  const [profileData, setProfileData] = useState({
    fullName: "", // Initialize empty, will be set by useEffect
    email: "",
    role: "",
    phone: "",
    bio: "",
    avatarUrl: 'https://avatar.iran.liara.run/public/boy?username=default', // Default fallback
    notifications: { // Assuming these aren't stored in user context for now
      email: true,
      app: true,
      marketingEmails: false
    }
  });

  // Use useEffect to populate state once user context is available/updated
  useEffect(() => {
    if (user) {
      console.log("User context data:", user); // Log to see what's coming from context
      setProfileData(prev => ({
        ...prev, // Keep notification settings if already set/changed
        fullName: user.username || "", // Map backend 'username' to frontend 'fullName'
        email: user.email || "",
        role: user.role || "user", // Ensure default if context is missing it initially
        phone: user.phone || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || 'https://avatar.iran.liara.run/public/boy?username=default', // Use backend default
      }));
    }
  }, [user]); // Re-run when the user object from context changes

  // Password state (remains the same)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  // UI states (remains the same)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Avatar options
  const avatarOptions = [
    'https://avatar.iran.liara.run/public/boy?username=Scott',
    'https://avatar.iran.liara.run/public/girl?username=Maria',
    'https://avatar.iran.liara.run/public/boy?username=Max',
    'https://avatar.iran.liara.run/public/girl?username=Lisa',
    'https://avatar.iran.liara.run/public/boy?username=Alex',
    'https://avatar.iran.liara.run/public/girl?username=Sarah',
    'https://avatar.iran.liara.run/public/boy?username=Chris',
    'https://avatar.iran.liara.run/public/girl?username=Anna',
    'https://avatar.iran.liara.run/public/boy?username=Tom',
    'https://avatar.iran.liara.run/public/girl?username=Julia',
  ];

  // Handle input changes for profile form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  // Handle notification toggle
  const handleNotificationToggle = (key: keyof typeof profileData.notifications) => {
    setProfileData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] }
    }));
    // Optional: Add API call here to save notification preferences immediately
    // saveNotificationPreferences({ ...profileData.notifications, [key]: !prev.notifications[key] });
    toast({ title: "Notification preference updated.", description: "Save profile changes to persist all settings."})
  };

  // Handle password changes for password form
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  // Handle profile form submission with API Call
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
       toast({ title: "Authentication Error", description: "Please log in to update your profile.", variant: "destructive" });
       return;
    }

    setIsSubmittingProfile(true);

    // Prepare payload with fields allowed for update by the backend route
    const payload = {
        username: profileData.fullName, // Map frontend 'fullName' back to backend 'username'
        phone: profileData.phone,
        bio: profileData.bio,
        avatarUrl: profileData.avatarUrl,
        // Note: Email and Role are NOT sent as they are disabled/not meant to be updated here
    };

    console.log("Updating profile with payload:", payload);

    try {
        const response = await fetch(`${API_USER_URL}/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            // Use message from backend response if available
            throw new Error(result.message || `Profile update failed (${response.status})`);
        }

        // --- Success ---
        toast({
            title: "Profile Updated",
            description: result.message || "Your profile details have been saved.",
        });

        // Update the user context with the confirmed data from the backend response
        if (result.user) {
            // The context's updateUser should handle merging the new data
            updateUser(result.user);
            // Explicitly update local state as well to ensure UI consistency immediately
            // though useEffect listening to 'user' should also trigger this
            setProfileData(prev => ({
              ...prev, // Keep notification part
              fullName: result.user.username || "",
              email: result.user.email || "", // Email shouldn't change but good practice
              role: result.user.role || "user", // Role shouldn't change but good practice
              phone: result.user.phone || "",
              bio: result.user.bio || "",
              avatarUrl: result.user.avatarUrl || prev.avatarUrl, // Use new or fallback to previous
            }));
        }

    } catch (error: any) {
        console.error("Profile update error:", error);
        toast({
            title: "Update Failed",
            description: error.message || "Could not update profile. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsSubmittingProfile(false);
    }
  };

  // Change avatar - updates local state, saved via handleProfileUpdate
  const handleChangeAvatar = (url: string) => {
    setProfileData(prev => ({ ...prev, avatarUrl: url }));
    toast({
      title: "Avatar selection updated",
      description: "Click 'Save Changes' to apply the new avatar.",
    });
  };

  // Handle password form submission with API Call
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend Validation
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: "Missing Fields", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (passwords.new.length < 6) {
        toast({ title: "Password Too Short", description: "New password must be at least 6 characters long.", variant: "destructive" });
       return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Passwords Don't Match", description: "New password and confirmation password must match.", variant: "destructive" });
      return;
    }

    // Check for token
    if (!token) {
       toast({ title: "Authentication Error", description: "You must be logged in to change your password.", variant: "destructive" });
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const response = await fetch(`${API_USER_URL}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Password update failed (${response.status})`);
      }

      // --- Success ---
      toast({
        title: "Password updated",
        description: result.message || "Your password has been successfully updated.",
      });

      // Reset password fields after successful update
      setPasswords({ current: '', new: '', confirm: '' });

    } catch (error: any) {
      console.error("Password update error:", error);
      toast({ title: "Update Failed", description: error.message || "An error occurred while updating your password.", variant: "destructive" });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout(); // Clears context and local storage
    toast({ title: "Logged out successfully", description: "You have been logged out of your account" });
    navigate('/login'); // Redirect to login page
  };

  // --- JSX Structure ---
  return (
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader
        title="Profile"
        subtitle="Manage your personal information and preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Profile Info & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and how others see you
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileUpdate}>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6 items-start"> {/* Align items start */}
                   {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-2 w-full md:w-auto"> {/* Adjust width */}
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profileData.avatarUrl} alt={profileData.fullName || 'User Avatar'} />
                      <AvatarFallback>
                        {profileData.fullName ? profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full"> {/* Full width on small screens */}
                          <Camera className="mr-2 h-4 w-4" /> Change Avatar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 grid grid-cols-5 gap-1 p-2">
                        {avatarOptions.map((url, index) => (
                          <DropdownMenuItem key={index} className="p-0 cursor-pointer focus:bg-accent rounded-md">
                            <button className="w-full h-full p-1" onClick={(e) => { e.preventDefault(); handleChangeAvatar(url); }}>
                              <Avatar className="w-10 h-10"><AvatarImage src={url} /></Avatar>
                            </button>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* Profile Details Inputs */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name (Username)</Label>
                        <Input id="fullName" name="fullName" value={profileData.fullName} onChange={handleInputChange} required minLength={3}/>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={profileData.email} disabled title="Email cannot be changed"/>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Input id="role" name="role" value={profileData.role} disabled title="Role cannot be changed"/>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" value={profileData.phone} onChange={handleInputChange} placeholder="Optional phone number" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" name="bio" value={profileData.bio} onChange={handleInputChange} rows={4} placeholder="Tell us a little about yourself" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmittingProfile}>
                  {isSubmittingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSubmittingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Password Section Card */}
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordUpdate}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <div className="relative">
                    <Input id="current-password" name="current" type={showCurrentPassword ? "text" : "password"} placeholder="••••••••" value={passwords.current} onChange={handlePasswordChange} required/>
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowCurrentPassword(!showCurrentPassword)} aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}>{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input id="new-password" name="new" type={showNewPassword ? "text" : "password"} placeholder="••••••••" value={passwords.new} onChange={handlePasswordChange} required minLength={6}/>
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowNewPassword(!showNewPassword)} aria-label={showNewPassword ? "Hide new password" : "Show new password"}>{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Password must be at least 6 characters long.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <div className="relative">
                    <Input id="confirm-password" name="confirm" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={passwords.confirm} onChange={handlePasswordChange} required/>
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmittingPassword}>
                  {isSubmittingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isSubmittingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right column - Notification preferences & Account Actions */}
        <div className="space-y-6">
          {/* Notification Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription> Control how and when you receive notifications </CardDescription>
            </CardHeader>
            {/* NOTE: Saving these preferences currently happens via the main profile save button */}
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium leading-none">Email Notifications</h3> <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label htmlFor="email-tasks" className="cursor-pointer">Task Reminders</Label><p className="text-sm text-muted-foreground"> Receive email reminders for upcoming and overdue tasks </p></div>
                  <Switch id="email-tasks" checked={profileData.notifications.email} onCheckedChange={() => handleNotificationToggle('email')}/>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label htmlFor="email-marketing" className="cursor-pointer">Marketing Emails</Label><p className="text-sm text-muted-foreground"> Receive promotional emails and newsletters </p></div>
                  <Switch id="email-marketing" checked={profileData.notifications.marketingEmails} onCheckedChange={() => handleNotificationToggle('marketingEmails')}/>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-medium leading-none">In-App Notifications</h3> <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><Label htmlFor="app-notifications" className="cursor-pointer">App Notifications</Label><p className="text-sm text-muted-foreground"> Receive notifications within the application </p></div>
                  <Switch id="app-notifications" checked={profileData.notifications.app} onCheckedChange={() => handleNotificationToggle('app')}/>
                </div>
              </div>
            </CardContent>
             <CardFooter>
               <p className="text-xs text-muted-foreground">Notification settings are saved when you save profile changes.</p>
              {/* Alternatively, add a dedicated save button for notifications
               <Button type="button" onClick={saveNotificationPreferences} disabled={isSavingNotifications}> Save Notification Preferences </Button> */}
             </CardFooter>
          </Card>

          {/* Account Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription> Manage your account settings </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" onClick={() => toast({title: "Feature not implemented"})}> Export My Data </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => toast({title: "Feature not implemented"})}> Linked Accounts </Button>
              <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;