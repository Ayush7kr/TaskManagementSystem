// src/pages/Tasks.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Filter, Plus, ListFilter, Loader2, AlertTriangle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast as sonnerToast } from 'sonner';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TaskCard, { TaskProps, TaskStatus } from '@/components/dashboard/TaskCard';
import TaskCreateForm from '@/components/dashboard/TaskCreateForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/contexts/UserContext';

// Define backend API URL for tasks
const API_TASKS_URL = 'http://localhost:3000/api/tasks';

const Tasks = () => {
  const [searchParams] = useSearchParams();
  const taskIdParam = searchParams.get('id'); // Renamed to avoid conflict

  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  // State for fetched tasks, loading, and errors
  const [allTasks, setAllTasks] = useState<TaskProps[]>([]); // Holds all fetched tasks
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useUser(); // Get token for auth

  // --- Fetch Tasks Logic ---
  const fetchTasks = useCallback(async () => {
    if (!token) {
      setError("Authentication required. Please log in.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_TASKS_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch tasks (${response.status})`);
      }

      const fetchedTasks = await response.json();

      // Transform backend data to frontend format
      const transformedTasks: TaskProps[] = fetchedTasks.map((task: any) => ({
        id: task._id,
        title: task.title,
        description: task.description,
        dueDate: parseISO(task.dueDate), // Convert ISO string to Date object
        priority: task.priority,
        status: task.status,
        assignee: task.assignee,
        createdAt: task.createdAt ? parseISO(task.createdAt) : undefined,
        updatedAt: task.updatedAt ? parseISO(task.updatedAt) : undefined,
      }));

      setAllTasks(transformedTasks); // Store all fetched tasks

    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err.message || "An unexpected error occurred while fetching tasks.");
      setAllTasks([]); // Clear tasks on error
    } finally {
      setIsLoading(false);
    }
  }, [token]); // Re-fetch if token changes

  // --- useEffect to fetch tasks on mount ---
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]); // Dependency on the memoized fetch function

  // --- Handle task highlighting based on URL params ---
  useEffect(() => {
    if (taskIdParam) {
      setHighlightedTaskId(taskIdParam);

      // Find the task *after* tasks have been loaded
      const task = allTasks.find(t => t.id === taskIdParam);
      if (task) {
         // Using sonnerToast for consistency
        sonnerToast.info("Task Located", {
          description: `Viewing task: ${task.title}`,
        });

        // Scroll logic remains the same
        setTimeout(() => {
          const element = document.getElementById(`task-${taskIdParam}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300); // Short delay to allow rendering
      }

      // Clear highlight timer remains the same
      const timer = setTimeout(() => {
        setHighlightedTaskId(null);
      }, 3000); // Highlight duration

      return () => clearTimeout(timer);
    }
  }, [taskIdParam, allTasks]); // Depend on allTasks being updated

  // --- Filter tasks based on search and filters using useMemo ---
  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      // Filter by search query (case-insensitive)
      const lowerSearchQuery = searchQuery.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(lowerSearchQuery) ||
        (task.description && task.description.toLowerCase().includes(lowerSearchQuery)) ||
        (task.assignee && task.assignee.toLowerCase().includes(lowerSearchQuery)); // Include assignee in search

      // Filter by status
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;

      // Filter by priority
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [allTasks, searchQuery, filterStatus, filterPriority]); // Recalculate only when these change


  // --- Handle Status Change (Optimistic Update + Backend Call) ---
  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    if (!token) {
        sonnerToast.error("Authentication Error", { description: "You must be logged in to update tasks." });
        return;
    }

    // Find the original task to revert if needed
    const originalTask = allTasks.find(task => task.id === id);
    if (!originalTask) return; // Should not happen normally

    // --- Optimistic UI Update ---
    setAllTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );

    try {
      const response = await fetch(`${API_TASKS_URL}/${id}`, { // Use the specific task URL
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }), // Send only the status
      });

      const result = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        // Throw an error to be caught by the catch block
        throw new Error(result.message || `Failed to update status (${response.status})`);
      }

      // --- Backend Confirmed Update ---
      // Update the state *again* with the confirmed data from the backend
      // This ensures consistency (e.g., updatedAt timestamp)
      const updatedTaskData = result.task; // Assuming backend returns { message: '...', task: {...} }
      const transformedUpdatedTask: TaskProps = {
          id: updatedTaskData._id,
          title: updatedTaskData.title,
          description: updatedTaskData.description,
          dueDate: parseISO(updatedTaskData.dueDate),
          priority: updatedTaskData.priority,
          status: updatedTaskData.status,
          assignee: updatedTaskData.assignee,
          createdAt: updatedTaskData.createdAt ? parseISO(updatedTaskData.createdAt) : undefined,
          updatedAt: updatedTaskData.updatedAt ? parseISO(updatedTaskData.updatedAt) : undefined,
      };

      setAllTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === id ? transformedUpdatedTask : task
        )
      );

      sonnerToast.success("Task Status Updated", {
        description: `Task "${originalTask.title}" marked as ${newStatus.replace('-', ' ')}.`,
      });

    } catch (err: any) {
      console.error("Error updating task status:", err);
      sonnerToast.error("Update Failed", {
        description: err.message || "Could not update task status. Please try again.",
      });

      // --- Revert Optimistic Update on Error ---
      setAllTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === id ? originalTask : task // Put the original task back
        )
      );
    }
  };

  // --- Handle Task Creation Success ---
  const handleCreateTaskSuccess = (newTaskData: any) => {
    // Transform the newly created task data from backend
    const transformedNewTask: TaskProps = {
      id: newTaskData._id,
      title: newTaskData.title,
      description: newTaskData.description,
      dueDate: parseISO(newTaskData.dueDate),
      priority: newTaskData.priority,
      status: newTaskData.status,
      assignee: newTaskData.assignee,
      createdAt: newTaskData.createdAt ? parseISO(newTaskData.createdAt) : undefined,
      updatedAt: newTaskData.updatedAt ? parseISO(newTaskData.updatedAt) : undefined,
    };

    // Add the new task to the main list (at the beginning for visibility)
    setAllTasks(prev => [transformedNewTask, ...prev]);
    setCreateDialogOpen(false);
    sonnerToast.success("Task Created", { description: `Task "${transformedNewTask.title}" added successfully.` });
  };

  // --- Clear Filters ---
  const clearFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setSearchQuery('');
    sonnerToast.info("Filters Cleared");
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader title="Tasks" subtitle="Manage and organize all your tasks" />

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search tasks (title, description, assignee)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
             disabled={isLoading} // Disable while loading
          />
        </div>

        <div className="flex gap-3 flex-wrap"> {/* Allow wrapping on small screens */}
          <Select value={filterStatus} onValueChange={setFilterStatus} disabled={isLoading}>
            <SelectTrigger className="w-full sm:w-[150px]"> {/* Adjust width */}
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority} disabled={isLoading}>
            <SelectTrigger className="w-full sm:w-[150px]"> {/* Adjust width */}
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isLoading}>
                <ListFilter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Add actual functionality to these later if needed */}
              <DropdownMenuLabel>View Options (TBD)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>Show Description</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Show Due Date</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>Show Assignee</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem onSelect={(e) => { e.preventDefault(); clearFilters(); }}> {/* Prevent closing */}
                Clear Filters
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setCreateDialogOpen(true)} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      {/* Tasks Grid / Loading / Error State */}
      <div className="bg-card rounded-xl shadow-sm p-4 sm:p-6 min-h-[300px] flex flex-col"> {/* Add min height */}
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : error ? (
           <div className="flex-1 flex flex-col items-center justify-center text-center border border-destructive/50 bg-destructive/10 rounded-md p-6">
             <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
             <p className="text-destructive font-semibold mb-1">Failed to load tasks</p>
             <p className="text-sm text-destructive/90 mb-4">{error}</p>
             <Button variant="destructive" size="sm" onClick={fetchTasks}>
               Retry
             </Button>
           </div>
        ) : filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"> {/* Added xl */}
            {filteredTasks.map(task => (
              <div
                id={`task-${task.id}`} // ID for scrolling
                key={task.id}
                className={`transition-all duration-500 rounded-lg ${ // Added rounded-lg
                  highlightedTaskId === task.id
                    ? "ring-2 ring-primary ring-offset-2 scale-[1.02]" // Subtle scale and ring on highlight
                    : ""
                }`}
              >
                <TaskCard
                  task={task}
                  onStatusChange={handleStatusChange} // Pass the updated handler
                  // Add onClick handler here if you need to open a detail view/edit modal
                  // onClick={() => console.log("Card clicked:", task.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          // No Tasks Found State
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <div className="flex justify-center mb-4">
              <div className="bg-muted rounded-full p-3">
                <Filter className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-medium mb-1">No tasks found</h3>
            <p className="text-muted-foreground">
              {searchQuery || filterStatus !== 'all' || filterPriority !== 'all' ?
                "Try adjusting your search or filters." :
                "Create your first task to get started!"
              }
            </p>
            {/* Show Clear Filters button only if filters are active */}
            {(searchQuery || filterStatus !== 'all' || filterPriority !== 'all') && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
             {/* Show Create Task button only if no filters are active and no tasks exist */}
             {!(searchQuery || filterStatus !== 'all' || filterPriority !== 'all') && allTasks.length === 0 && (
                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                   <Plus className="mr-2 h-4 w-4" /> Create Task
                </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskCreateForm
            onSubmitSuccess={handleCreateTaskSuccess} // Pass the success handler
            onCancel={() => setCreateDialogOpen(false)} // Handler to close dialog
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Tasks;