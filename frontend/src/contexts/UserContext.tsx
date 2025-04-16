// src/contexts/UserContext.tsx

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';

// --- Constants ---
const API_BASE_URL = 'http://localhost:3000/api/auth'; // Your backend auth URL
const API_USER_URL = 'http://localhost:3000/api/user'; // Your backend user URL

// Keys for localStorage
const AUTH_TOKEN_KEY = 'taskmaster_auth_token';
const USER_DATA_KEY = 'taskmaster_user_data';

// --- Interfaces ---
export interface UserData {
  _id: string;
  username: string;
  email: string;
  // --- ADDED/MODIFIED FIELDS ---
  // Make them optional as they might not exist immediately or have default values
  role?: string; // e.g., 'user' | 'admin'
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  // You might also want createdAt/updatedAt if you use them
  createdAt?: string; // Store as string if received as ISO string
  updatedAt?: string;
}

// Define Registration Data structure
export interface RegistrationData {
    username: string;
    email: string;
    password: string;
}

// --- MODIFIED Context Type ---
interface UserContextType {
  user: UserData | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean; // For initial auth check
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<UserData>) => void; // Function to update user data
}

// --- Context Definition ---
const UserContext = createContext<UserContextType | undefined>(undefined);

// --- Provider Component ---
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial load

  // --- Initialization Effect (Check localStorage on mount) ---
  useEffect(() => {
    console.log("UserProvider: Initializing from localStorage...");
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_DATA_KEY);

      if (storedToken && storedUser) {
        console.log("UserProvider: Found token and user data in storage.");
        try {
            const parsedUser: UserData = JSON.parse(storedUser);
            // Basic validation - ensure essential fields exist
            if (parsedUser?._id && parsedUser?.username && parsedUser?.email) {
                setToken(storedToken);
                setUser(parsedUser); // Set the full user data including new fields
                console.log("UserProvider: State hydrated from storage:", parsedUser);
            } else {
                 console.warn("UserProvider: Stored user data is invalid or missing essential fields.");
                 throw new Error("Invalid stored user data");
            }
        } catch (parseError) {
             console.error("UserProvider: Failed to parse stored user data:", parseError);
             // Clear corrupted storage
             localStorage.removeItem(AUTH_TOKEN_KEY);
             localStorage.removeItem(USER_DATA_KEY);
        }
      } else {
        console.log("UserProvider: No valid auth data found in storage.");
      }
    } catch (error) {
      console.error("UserProvider: Error during initialization:", error);
      // Ensure clean state on error
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      setToken(null);
      setUser(null);
    } finally {
        console.log("UserProvider: Initialization complete. isLoading: false.");
        setIsLoading(false); // Finished initial loading check
    }
  }, []); // Run only once on mount

  // --- Login Function (MODIFIED to handle new fields) ---
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Login failed (${response.status})`);
      if (!data.token || !data.user) throw new Error("Login response missing token or user data.");

      // Construct UserData including the new fields from backend response
      const userData: UserData = {
          _id: data.user._id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role, // Get role from backend
          phone: data.user.phone, // Get phone from backend
          bio: data.user.bio, // Get bio from backend
          avatarUrl: data.user.avatarUrl, // Get avatarUrl from backend
          createdAt: data.user.createdAt, // Optional: Store dates if needed
          updatedAt: data.user.updatedAt,
      };

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      // Store the *full* user data object
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      setToken(data.token);
      setUser(userData); // Update state with the full user data
      console.log("Login successful, user data set:", userData);

    } catch (error) {
        console.error("Login failed:", error);
        // Clear state and storage on login failure
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        setToken(null);
        setUser(null);
        throw error; // Re-throw for the component to handle UI feedback
    }
  }, []);

  // --- Register Function (Remains the same - doesn't log in) ---
  const register = useCallback(async (registrationData: RegistrationData) => {
      try {
          const response = await fetch(`${API_BASE_URL}/register`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(registrationData),
          });
          const data = await response.json();
          if (!response.ok) {
              throw new Error(data.message || `Registration failed (${response.status})`);
          }
          console.log("Registration successful:", data.message);
          // Does not log the user in or update state here
      } catch (error) {
          console.error("Registration failed:", error);
          throw error; // Re-throw for the component
      }
  }, []);

  // --- Logout Function (Remains the same) ---
  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    setToken(null);
    setUser(null);
    console.log("User logged out.");
    // Optionally redirect here or let the component handle it
  }, []);

  // --- NEW: Update User Function ---
  const updateUser = useCallback((updatedData: Partial<UserData>) => {
    setUser(prevUser => {
        if (!prevUser) {
            console.warn("updateUser called when user is null");
            return null; // No user to update
        }

        // Merge new data with existing user data
        const newUser = { ...prevUser, ...updatedData };

        // Update localStorage with the complete merged user object
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(newUser));

        console.log("User context state updated via updateUser:", newUser);
        return newUser; // Return the updated state
    });
  }, []); // No dependencies needed, it just updates the state setter

  // --- Derived State ---
  const isLoggedIn = !!token && !!user;

  // --- Context Value (MODIFIED to include updateUser) ---
  const value: UserContextType = {
    user,
    token,
    isLoggedIn,
    isLoading,
    login,
    register,
    logout,
    updateUser, // Provide the updateUser function
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// --- Hook (Remains the same) ---
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};