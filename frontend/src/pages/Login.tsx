import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useUser } from '@/contexts/UserContext'; // Ensure this path is correct

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Local loading state for the form submission

  const { login } = useUser(); // Get the login function from context
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  // Determine where to redirect after login
  // Redirect to the 'from' location if it exists in state, otherwise default to '/' (or '/dashboard')
  const from = location.state?.from?.pathname || '/';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Make the handler async to use await
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call the login function from the context, passing the credentials
      // This function now handles the API call internally
      await login(credentials);

      // If login is successful (doesn't throw an error):
      toast({
        title: "Logged in successfully",
        description: "Welcome back to TaskMaster!",
        // You might want variant: 'success' if your toast supports it
      });

      // Navigate to the original destination or the default route
      navigate(from, { replace: true });

    } catch (error: any) {
      // If login fails (context login function throws an error):
      console.error("Login error:", error); // Log the full error for debugging
      toast({
        variant: "destructive", // Use destructive style for errors
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.", // Display backend error message
      });
    } finally {
      // Ensure loading state is turned off regardless of success or failure
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          {/* Your Logo/Header */}
          <div className="flex justify-center">
             <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center"> {/* Use theme color */}
              <span className="text-primary-foreground font-bold text-xl">TM</span> {/* Use theme color */}
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">TaskMaster</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password below
            </CardDescription>
          </CardHeader>
          {/* Point the form's onSubmit to the new handler */}
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email" // Make sure name attribute matches state key
                  type="email"
                  placeholder="name@example.com"
                  value={credentials.email}
                  onChange={handleInputChange}
                  disabled={isLoading} // Disable input while loading
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {/* Keep Forgot Password link functional or remove if not implemented */}
                  <Button variant="link" size="sm" className="px-0 h-auto text-xs font-normal" type="button">
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password" // Make sure name attribute matches state key
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={handleInputChange}
                    disabled={isLoading} // Disable input while loading
                    required
                  />
                  <Button
                    type="button" // Ensure it doesn't submit the form
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3" // Adjust padding if needed
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading} // Disable button while loading
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {/* Disable button based on isLoading state */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  // Optional: Add a spinner icon here
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="px-8 text-center text-sm text-muted-foreground">
          <span>Don't have an account? </span>
          {/* Update this Button/Link to navigate to your registration page */}
          <Button
            variant="link"
            className="p-0 h-auto text-sm font-normal"
            onClick={() => navigate('/register')} // Example navigation
            disabled={isLoading}
          >
            Sign up
          </Button>
        </p>
      </div>
    </div>
  );
};

export default Login;