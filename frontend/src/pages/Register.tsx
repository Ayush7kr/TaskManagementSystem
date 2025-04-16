// src/pages/Register.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, UserPlus } from 'lucide-react'; // Use UserPlus icon
import { useUser } from '@/contexts/UserContext'; // Ensure this path is correct

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '', // Added confirmation field
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Local loading state for the form

  const { register } = useUser(); // Get the register function from context
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Client-side validation: Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "The passwords you entered do not match.",
      });
      setIsLoading(false);
      return; // Stop submission
    }

     // Client-side validation: Check password length (redundant if backend checks, but good UX)
    if (formData.password.length < 6) {
       toast({
            variant: "destructive",
            title: "Password Too Short",
            description: "Password must be at least 6 characters long.",
       });
       setIsLoading(false);
       return;
    }

    try {
      // Call the register function from the context
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        // Don't send confirmPassword to backend
      });

      // If registration is successful:
      toast({
        title: "Registration Successful",
        description: "Your account has been created. Please log in.",
        // variant: 'success', // Optional success style
      });

      // Navigate to the login page after successful registration
      navigate('/login');

    } catch (error: any) {
      // If registration fails:
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "Could not create account. Please try again.", // Show backend error message
      });
    } finally {
      setIsLoading(false); // Turn off loading state
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          {/* Logo/Header */}
          <div className="flex justify-center">
             <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">TM</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your details below to create your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Fill in the form to get started
            </CardDescription>
          </CardHeader>
          {/* Point form onSubmit to handleRegister */}
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              {/* Username Field */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </div>
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  required
                />
              </div>
              {/* Password Field */}
              <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min. 6 chars)"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    minLength={6} // Add browser validation
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {/* Confirm Password Field */}
              <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    minLength={6} // Add browser validation
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  "Creating Account..."
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Sign Up
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="px-8 text-center text-sm text-muted-foreground">
          <span>Already have an account? </span>
          {/* Link back to login page */}
          <Button
            variant="link"
            className="p-0 h-auto text-sm font-normal"
            onClick={() => navigate('/login')} // Navigate to login
            disabled={isLoading}
          >
            Sign in
          </Button>
        </p>
      </div>
    </div>
  );
};

export default Register;