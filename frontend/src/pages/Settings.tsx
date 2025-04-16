
import React from 'react';
import { Save, User, Bell, Lock, Eye, PaintBucket, Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

const Settings = () => {
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulating a save action
    // In a real app, this would save the settings to the server
    console.log('Settings saved');
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader 
        title="Settings" 
        subtitle="Manage your account settings and preferences" 
      />
      
      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 md:w-auto">
          <TabsTrigger value="profile" className="flex gap-2 items-center">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex gap-2 items-center">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex gap-2 items-center">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex gap-2 items-center">
            <PaintBucket className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and how others see you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="https://i.pravatar.cc/150?img=30" alt="Profile" />
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input id="fullName" defaultValue="John Smith" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue="john@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input id="role" defaultValue="Student" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" defaultValue="(123) 456-7890" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      defaultValue="Computer Science student with interests in machine learning and web development."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium leading-none">Email Notifications</h3>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-tasks">Task Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email reminders for upcoming and overdue tasks
                    </p>
                  </div>
                  <Switch id="email-tasks" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-updates">Team Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails when team members assign you tasks
                    </p>
                  </div>
                  <Switch id="email-updates" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-marketing">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive promotional emails and newsletters
                    </p>
                  </div>
                  <Switch id="email-marketing" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium leading-none">In-App Notifications</h3>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="app-tasks">Task Status Changes</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your tasks are updated
                    </p>
                  </div>
                  <Switch id="app-tasks" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="app-mentions">Mentions and Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when someone mentions or comments on your tasks
                    </p>
                  </div>
                  <Switch id="app-mentions" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="app-reminders">Due Date Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminders before tasks are due
                    </p>
                  </div>
                  <Switch id="app-reminders" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password and Security</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium leading-none">Change Password</h3>
                <Separator />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input 
                        id="current-password" 
                        type="password" 
                        placeholder="••••••••"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-full"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input 
                        id="new-password" 
                        type="password" 
                        placeholder="••••••••"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-full"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters including a number and a special character
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        placeholder="••••••••"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-full"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium leading-none">Two-Factor Authentication</h3>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="2fa-enable">Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch id="2fa-enable" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Update Security Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the application looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium leading-none">Theme</h3>
                <Separator />
                
                <RadioGroup defaultValue="system" className="grid grid-cols-3 gap-4">
                  <Label
                    htmlFor="theme-system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                    <Monitor className="mb-3 h-6 w-6" />
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-medium">System</h3>
                      <p className="text-xs text-muted-foreground">
                        Follow system theme
                      </p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="theme-light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                    <Sun className="mb-3 h-6 w-6" />
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-medium">Light</h3>
                      <p className="text-xs text-muted-foreground">
                        Always use light theme
                      </p>
                    </div>
                  </Label>
                  <Label
                    htmlFor="theme-dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-background p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                    <Moon className="mb-3 h-6 w-6" />
                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-medium">Dark</h3>
                      <p className="text-xs text-muted-foreground">
                        Always use dark theme
                      </p>
                    </div>
                  </Label>
                </RadioGroup>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium leading-none">Sidebar</h3>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sidebar-collapsed">Remember Sidebar State</Label>
                    <p className="text-sm text-muted-foreground">
                      Save the sidebar's open/closed state between sessions
                    </p>
                  </div>
                  <Switch id="sidebar-collapsed" defaultChecked />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium leading-none">Accessibility</h3>
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="reduce-motion">Reduce Motion</Label>
                    <p className="text-sm text-muted-foreground">
                      Minimize animations throughout the application
                    </p>
                  </div>
                  <Switch id="reduce-motion" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="high-contrast">High Contrast</Label>
                    <p className="text-sm text-muted-foreground">
                      Increase contrast for better visibility
                    </p>
                  </div>
                  <Switch id="high-contrast" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Appearance Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Settings;
