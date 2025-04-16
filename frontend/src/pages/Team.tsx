// Team.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Phone, MoreHorizontal, UserPlus, Loader2, AlertTriangle } from 'lucide-react'; // Import Loader2, AlertTriangle
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Import Label
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter, // Import DialogFooter
    DialogClose // Import DialogClose
} from "@/components/ui/dialog";
// Optional: If you want role selection in the dialog
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUser } from '@/contexts/UserContext'; // Import useUser to get token
import { useToast } from '@/components/ui/use-toast'; // Import useToast

// Define backend API URL for team actions
const API_TEAM_URL = 'http://localhost:3000/api/team';

// Frontend Interface - Adapt to what backend provides initially
interface TeamMember {
  id: string;        // Corresponds to _id
  name: string;      // Corresponds to username
  role: string;
  email: string;
  phone?: string;     // Optional
  avatar?: string;    // Optional, corresponds to avatarUrl
  // tasks and status omitted as they are not directly provided by the current backend route
}

// --- Add Member Form Data Interface ---
interface NewMemberData {
    username: string;
    email: string;
    password: string;
    role: string; // Default to 'user'
}

const Team = () => {
  const { token } = useUser(); // Get token for API calls
  const { toast } = useToast();

  // --- State ---
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [newMemberData, setNewMemberData] = useState<NewMemberData>({
      username: '',
      email: '',
      password: '',
      role: 'user' // Default role set here matches backend default assumption
  });
  const [isAddingMember, setIsAddingMember] = useState(false); // Loading state for add form
  const [searchTerm, setSearchTerm] = useState(''); // State for search input

  // --- Data Fetching ---
  const fetchMembers = useCallback(async () => {
    if (!token) {
      setError("Authentication required to view team members.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    console.log("Fetching team members...");

    try {
      const response = await fetch(`${API_TEAM_URL}/members`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch members (${response.status})`);
      }

      const backendUsers = await response.json();
      console.log("Fetched members data:", backendUsers);

      // Transform backend data (User schema) to frontend TeamMember interface
      const transformedMembers: TeamMember[] = backendUsers.map((user: any) => ({
        id: user._id,
        name: user.username,
        role: user.role || 'user',
        email: user.email,
        phone: user.phone || undefined,
        avatar: user.avatarUrl || undefined,
      }));

      setMembers(transformedMembers);

    } catch (err: any) {
      console.error("Error fetching team members:", err);
      setError(err.message || "An unexpected error occurred while fetching members.");
      setMembers([]); // Clear members on error
    } finally {
      setIsLoading(false);
      console.log("Finished fetching members.");
    }
  }, [token]);

  // --- useEffect to fetch on mount ---
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // --- Add Member Form Handling ---
  const handleNewMemberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setNewMemberData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!token) {
          toast({ title: "Error", description: "Authentication required to add members.", variant: "destructive" });
          return;
      }
      // Basic validation
      if (!newMemberData.username || !newMemberData.email || !newMemberData.password) {
          toast({ title: "Missing Fields", description: "Please fill in Username, Email, and Password.", variant: "destructive" });
          return;
      }
       if (newMemberData.password.length < 6) {
          toast({ title: "Password Too Short", description: "Password must be at least 6 characters.", variant: "destructive" });
          return;
       }
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(newMemberData.email)) {
        toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
        return;
      }

      setIsAddingMember(true);
      console.log("Attempting to add new member:", { ...newMemberData, password: '***' });

      try {
          const response = await fetch(`${API_TEAM_URL}/members`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
              },
              // Send role too, backend will use it or default
              body: JSON.stringify(newMemberData),
          });

          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.message || `Failed to add member (${response.status})`);
          }

          console.log("Member added successfully:", result.user);
          toast({ title: "Success", description: result.message || "Team member added." });

          // Add new member to the top of the list using the returned user data
          const addedMember: TeamMember = {
              id: result.user._id,
              name: result.user.username,
              role: result.user.role,
              email: result.user.email,
              phone: result.user.phone || undefined,
              avatar: result.user.avatarUrl || undefined,
          };
          setMembers(prev => [addedMember, ...prev]);

          // Reset form and close dialog
          setNewMemberData({ username: '', email: '', password: '', role: 'user' });
          setIsAddMemberDialogOpen(false);

      } catch (err: any) {
          console.error("Error adding team member:", err);
          toast({ title: "Error Adding Member", description: err.message || "An unexpected error occurred.", variant: "destructive" });
      } finally {
          setIsAddingMember(false);
      }
  };


  // --- Filtering Logic ---
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );


  // --- Helper Functions ---
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase();
  };

   // Status is removed for now, defaulting to active visually
   const getStatusColor = () => {
       return 'bg-green-500'; // Default visual status
   };

  // --- Render Logic ---
  return (
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader
        title="Team"
        subtitle="View and manage your team members"
      />

      {/* Team Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            disabled={isLoading || !!error} // Disable search if loading or error
          />
        </div>

        {/* --- Add Member Dialog --- */}
        <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
            <DialogTrigger asChild>
                <Button disabled={isLoading}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Team Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleAddMemberSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add New Team Member</DialogTitle>
                        <DialogDescription>
                            Enter the details for the new team member. They will be registered as a new user with a 'user' role by default.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-1.5"> {/* Added spacing */}
                            <Label htmlFor="add-username">Username</Label> {/* Unique ID */}
                            <Input id="add-username" name="username" value={newMemberData.username} onChange={handleNewMemberInputChange} placeholder="e.g., John Doe" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="add-email">Email</Label> {/* Unique ID */}
                            <Input id="add-email" name="email" type="email" value={newMemberData.email} onChange={handleNewMemberInputChange} placeholder="e.g., john.doe@example.com" required />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="add-password">Temporary Password</Label> {/* Unique ID */}
                            <Input id="add-password" name="password" type="password" value={newMemberData.password} onChange={handleNewMemberInputChange} placeholder="Min. 6 characters" required minLength={6}/>
                            <p className="text-xs text-muted-foreground">The new member should change this password upon first login.</p>
                        </div>
                        {/* Optional Role Selection (Uncomment if needed) */}
                        {/* <div className="space-y-1.5">
                            <Label htmlFor="add-role">Role</Label>
                            <Select name="role" value={newMemberData.role} onValueChange={(value) => setNewMemberData(prev => ({ ...prev, role: value }))}>
                                <SelectTrigger id="add-role">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                         </div> */}
                    </div>
                    <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="outline">Cancel</Button>
                         </DialogClose>
                        <Button type="submit" disabled={isAddingMember}>
                            {isAddingMember && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isAddingMember ? 'Adding...' : 'Add Member'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

      </div>

      {/* Conditional Rendering: Loading, Error, Data Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading team members...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center text-center border border-destructive/50 bg-destructive/10 rounded-lg p-8 text-destructive">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p className="text-xl font-semibold mb-2">Failed to load team members</p>
          <p className="text-base mb-6">{error}</p>
          <Button variant="destructive" size="lg" onClick={fetchMembers}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M21.5 2v6h-6M2.5 22v-6h6"/><path d="M22 11.5A10 10 0 0 1 3.5 22.5"/><path d="M2 12.5a10 10 0 0 1 18.5-10"/></svg>
             Retry
          </Button>
        </div>
      ) : filteredMembers.length === 0 ? (
         <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border rounded-lg">
             {searchTerm ? (
                <>
                    <p className="text-lg font-medium">No members match "{searchTerm}".</p>
                    <p className="mt-1">Try searching for a different name, email, or role.</p>
                </>
             ) : (
                <>
                    <p className="text-lg font-medium">No team members found.</p>
                    <p className="mt-1">Click "Add Team Member" to build your team!</p>
                </>
             )}
         </div>
      ) : (
        // --- Team Members Grid ---
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredMembers.map(member => (
            <div
              key={member.id}
              className="bg-card rounded-xl p-4 shadow-sm border hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col"
            >
              {/* Top Section: Avatar, Name, Role, Menu */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3 min-w-0"> {/* Added min-w-0 for flexbox truncation */}
                  <Avatar className="h-11 w-11 flex-shrink-0">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                        {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0"> {/* Added min-w-0 */}
                    <h3 className="font-semibold text-base leading-tight flex items-center gap-1.5 truncate">
                      <span className="truncate" title={member.name}>{member.name}</span>
                       {/* Status indicator - defaulting to active green */}
                      <span className={`w-2 h-2 rounded-full ${getStatusColor()} flex-shrink-0`} title="Status (Default: Active)" />
                    </h3>
                    <p className="text-muted-foreground text-sm capitalize truncate" title={member.role}>{member.role}</p>
                  </div>
                </div>
                {/* Actions Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -mr-2 -mt-1">
                      <MoreHorizontal className="h-4 w-4" />
                       <span className="sr-only">Actions for {member.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{member.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => toast({title: "Info", description:"View Profile action triggered." })}>View Profile</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toast({title: "Info", description:"Assign Task action triggered." })}>Assign Task</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toast({title: "Info", description:"Send Message action triggered." })}>Send Message</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onSelect={() => toast({title: "Info", description:"Remove member action triggered." })}>
                      Remove from Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Middle Section: Contact Info */}
              <div className="space-y-1.5 text-sm mb-4 flex-grow">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <a href={`mailto:${member.email}`} className="truncate hover:underline" title={member.email}>{member.email}</a>
                </div>
                 {member.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <a href={`tel:${member.phone}`} className="hover:underline" title={member.phone}>{member.phone}</a>
                    </div>
                 )}
              </div>

               {/* Bottom Section: Task Count (Placeholder) */}
               <div className="mt-auto pt-3 border-t flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground">Assigned Tasks</span>
                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-xs font-medium" title="Task count feature coming soon">
                     N/A
                  </span>
               </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default Team;