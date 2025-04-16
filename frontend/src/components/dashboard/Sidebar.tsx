
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Users, 
  BarChart3, 
  UserCircle, 
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isMobile: boolean;
}

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  path: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const { toast } = useToast();
  const currentPath = location.pathname;
  
  const sidebarItems: SidebarItem[] = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { title: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { title: 'Calendar', icon: Calendar, path: '/calendar' },
    { title: 'Team', icon: Users, path: '/team' },
    { title: 'Analytics', icon: BarChart3, path: '/analytics' },
    { title: 'Profile', icon: UserCircle, path: '/profile' },
  ];

  const isActive = (path: string) => {
    return currentPath === path || 
      (path !== '/' && currentPath.startsWith(path));
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account",
    });
    navigate('/login');
  };

  // Get first letter of each word in full name for avatar
  const getInitials = (name: string) => {
    return "A";
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed md:relative h-full bg-sidebar z-50 border-r transition-all duration-300 overflow-hidden",
          isOpen ? "w-64" : isMobile ? "w-0" : "w-16",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b">
            <div className={cn(
              "flex items-center",
              !isOpen && !isMobile && "hidden"
            )}>
              <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center mr-2">
                <span className="text-white font-bold text-lg">TM</span>
              </div>
              <h1 className="font-display font-bold text-lg">TaskMaster</h1>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className={cn("md:flex", isMobile && !isOpen && "hidden")}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 py-4 px-2 overflow-y-auto">
            <ul className="space-y-1">
              {sidebarItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.title}>
                    <Link 
                      to={item.path}
                      className={cn(
                        "sidebar-item", 
                        active && "active"
                      )}
                    >
                      <item.icon size={20} />
                      <span className={cn("transition-opacity", 
                        !isOpen && !isMobile ? "opacity-0 w-0" : "opacity-100"
                      )}>
                        {item.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className={cn(
            "p-4 border-t mt-auto flex items-center gap-3", 
            !isOpen && !isMobile && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center">
              <span className="text-white font-bold text-sm">{getInitials("Ayush")}</span>
            </div>
            <div className={cn(
              "transition-opacity flex-1", 
              !isOpen && !isMobile ? "opacity-0 w-0" : "opacity-100"
            )}>
              <p className="text-sm font-medium">{"Ayush"}</p>
              <p className="text-xs text-muted-foreground">{"Admin"}</p>
            </div>
            {isOpen && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut size={20} />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      {isMobile && !isOpen && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-3 left-3 z-50"
          onClick={toggleSidebar}
        >
          <Menu size={24} />
        </Button>
      )}
    </>
  );
};

export default Sidebar;
