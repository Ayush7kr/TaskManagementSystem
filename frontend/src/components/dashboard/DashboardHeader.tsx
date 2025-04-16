
import React, { useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';

// Define a TaskNotification type for notifications
interface TaskNotification {
  id: string;
  title: string;
  message: string;
  taskId: string;
}

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, subtitle }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const navigate = useNavigate();

  // Mocked search results for demo purposes - in a real app, this would be fetched or filtered from actual data
  const searchResults = [
    { id: '1', title: 'Complete Research Paper', type: 'task' },
    { id: '2', title: 'Prepare Presentation Slides', type: 'task' },
    { id: '3', title: 'Submit Math Assignment', type: 'task' },
    { id: '4', title: 'Team Meeting', type: 'task' },
    { id: '5', title: 'Read Chapter 5', type: 'task' },
  ];

  // Mock notifications - in a real app, these would be fetched from an API
  const notifications: TaskNotification[] = [
    {
      id: 'notif1',
      title: 'Task deadline approaching',
      message: 'Project report due in 24 hours',
      taskId: '1'
    },
    {
      id: 'notif2',
      title: 'New comment on task',
      message: 'Sarah commented on "Research Paper"',
      taskId: '1'
    },
    {
      id: 'notif3',
      title: 'Task assigned to you',
      message: 'Team leader assigned you "Presentation Slides"',
      taskId: '2'
    }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsCommandOpen(true);
    }
  };

  const handleSearchSelect = (id: string) => {
    setIsCommandOpen(false);
    setSearchQuery('');
    
    // Navigate to tasks page with the selected task
    navigate(`/tasks?id=${id}`);
    
    toast({
      title: "Task Found",
      description: "Navigating to selected task",
    });
  };

  const handleNotificationClick = (notification: TaskNotification) => {
    // Navigate to the task page with the specific task ID
    navigate(`/tasks?id=${notification.taskId}`);
    
    toast({
      title: "Notification Selected",
      description: `Navigating to task: ${notification.title}`,
    });
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div className="animate-slide-in">
        <h1 className="text-2xl md:text-3xl font-display font-semibold">{title}</h1>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-2 w-full md:w-auto">
        <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search tasks..." 
            className="pl-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => setIsCommandOpen(true)}
          />
        </form>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal text-xs rounded-full flex items-center justify-center text-white">
                {notifications.length}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="p-2 font-medium border-b">
              Notifications ({notifications.length})
            </div>
            {notifications.map(notification => (
              <DropdownMenuItem 
                key={notification.id}
                className="py-3 px-4 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Command Dialog for search results */}
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput 
          placeholder="Search tasks..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Tasks">
            {searchResults
              .filter(result => result.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(result => (
                <CommandItem 
                  key={result.id}
                  onSelect={() => handleSearchSelect(result.id)}
                >
                  <Search className="mr-2 h-4 w-4" />
                  <span>{result.title}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default DashboardHeader;
