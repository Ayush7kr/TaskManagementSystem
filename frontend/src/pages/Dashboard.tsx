// src/pages/Dashboard.tsx

import React, { useState, useEffect, useCallback } from 'react'; // Import useEffect, useCallback
import { format, addDays, subDays, parseISO } from 'date-fns'; // Import parseISO
import { cn } from '@/lib/utils';
import {
  CheckSquare,
  Clock,
  ListTodo,
  Users,
  Plus,
  Loader2, // Import Loader icon
  AlertTriangle // Import Alert icon for errors
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatCard from '@/components/dashboard/StatCard';
import TaskCard, { TaskProps, TaskStatus } from '@/components/dashboard/TaskCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TaskCreateForm from '@/components/dashboard/TaskCreateForm';
import { useUser } from '@/contexts/UserContext'; // Import useUser
import { toast as sonnerToast } from 'sonner'; // Use consistent toast import

// Define backend API URL for tasks
const API_TASKS_URL = 'http://localhost:3000/api/tasks';

const Dashboard = () => {
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskProps[]>([]); // Initialize with empty array
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading
  const [error, setError] = useState<string | null>(null); // State for fetch errors
  const { token, user } = useUser(); // Get token and user info

  // --- Fetch Tasks Logic ---
  const fetchTasks = useCallback(async () => {
    if (!token) {
      setError("Authentication required. Please log in.");
      setIsLoading(false);
      return; // Don't fetch if not logged in
    }

    setIsLoading(true);
    setError(null); // Clear previous errors

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

      // Transform backend data (_id, date strings) to frontend format (id, Date objects)
      const transformedTasks: TaskProps[] = fetchedTasks.map((task: any) => ({
        id: task._id, // Map _id to id
        title: task.title,
        description: task.description,
        dueDate: parseISO(task.dueDate), // Convert ISO string to Date object
        priority: task.priority,
        status: task.status,
        assignee: task.assignee,
        createdAt: task.createdAt ? parseISO(task.createdAt) : undefined, // Optional
        updatedAt: task.updatedAt ? parseISO(task.updatedAt) : undefined, // Optional
      }));

      setTasks(transformedTasks);

    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err.message || "An unexpected error occurred while fetching tasks.");
      setTasks([]); // Clear tasks on error
    } finally {
      setIsLoading(false);
    }
  }, [token]); // Dependency: re-fetch if token changes

  // --- useEffect to fetch tasks on mount and when token changes ---
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]); // Use the memoized fetchTasks function

  // --- Handler for Status Change (Needs Backend Integration Later) ---
  const handleStatusChange = (id: string, newStatus: TaskStatus) => {
    // TODO: Implement backend call to update task status
    console.log(`TODO: Update task ${id} status to ${newStatus} on backend`);
    // Optimistic UI update (update locally first)
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );
    // Ideally, revert if backend call fails
    sonnerToast.info("Status updated (Local)", { description: "Backend update needed for persistence."});
  };

  // --- Handler for Task Creation Success ---
  // Called by TaskCreateForm's onSubmitSuccess prop
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

    // Add the new task to the beginning of the list
    setTasks(prev => [transformedNewTask, ...prev]);
    setCreateDialogOpen(false); // Close the dialog
  };

  // --- Derived Data (Calculations based on fetched tasks) ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  // const pendingTasks = tasks.filter(task => task.status === 'pending').length; // Not used in stats
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;

  const todayTasks = tasks.filter(task =>
    format(task.dueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );
  const upcomingTasks = tasks.filter(task =>
    task.dueDate > new Date() &&
    format(task.dueDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')
  );
  // Correct Overdue: Before today's date start AND not completed
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  const overdueTasks = tasks.filter(task =>
    task.dueDate < startOfToday && task.status !== 'completed'
  );

  // --- Helper to render task list or messages ---
  const renderTaskList = (taskList: TaskProps[], emptyMessage: string) => {
    if (taskList.length === 0) {
      return (
        <p className="col-span-full text-center py-8 text-muted-foreground">
          {emptyMessage}
        </p>
      );
    }
    return taskList.map(task => (
      <TaskCard
        key={task.id}
        task={task}
        onStatusChange={handleStatusChange}
      />
    ));
  };


  return (
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader
        title="Dashboard"
        // Use username from context if available
        subtitle={`Welcome back ${user?.username ?? ''}, today is ${format(new Date(), 'EEEE, MMMM d')}`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
         {/* Update stats based on dynamic data */}
         <StatCard title="Total Tasks" value={totalTasks} icon={ListTodo} className="border-l-4 border-l-blue" />
         <StatCard title="In Progress" value={inProgressTasks} icon={Clock} className="border-l-4 border-l-teal" />
         <StatCard title="Completed" value={completedTasks} icon={CheckSquare} className="border-l-4 border-l-task-low" />
         <StatCard title="Team Members" value={1} icon={Users} className="border-l-4 border-l-blue-dark" /> {/* Placeholder */}
      </div>

      {/* Tasks Section */}
      <div className="bg-card rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold">Your Tasks</h2>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Task
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading tasks...</span>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
           <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-destructive/50 bg-destructive/10 rounded-md">
             <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
             <p className="text-destructive font-semibold mb-1">Failed to load tasks</p>
             <p className="text-sm text-destructive/90 mb-4">{error}</p>
             <Button variant="destructive" size="sm" onClick={fetchTasks}>
               Retry
             </Button>
           </div>
        )}

        {/* Tasks Tabs (only show if not loading and no error) */}
        {!isLoading && !error && (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4">
               {/* Update counts dynamically */}
              <TabsTrigger value="all">All ({tasks.length})</TabsTrigger>
              <TabsTrigger value="today">Today ({todayTasks.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingTasks.length})</TabsTrigger>
              <TabsTrigger value="overdue" className={overdueTasks.length > 0 ? "text-task-high" : ""}>
                  Overdue ({overdueTasks.length})
              </TabsTrigger>
            </TabsList>

            {/* Render task lists using the helper function */}
            <TabsContent value="all" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderTaskList(tasks, "You haven't created any tasks yet.")}
                </div>
            </TabsContent>
             <TabsContent value="today" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderTaskList(todayTasks, "No tasks due today.")}
                </div>
            </TabsContent>
             <TabsContent value="upcoming" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderTaskList(upcomingTasks, "No upcoming tasks.")}
                </div>
            </TabsContent>
            <TabsContent value="overdue" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {renderTaskList(overdueTasks, "No overdue tasks. Great job!")}
                </div>
            </TabsContent>

          </Tabs>
        )}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskCreateForm
             // Pass the success handler instead of the old one
            onSubmitSuccess={handleCreateTaskSuccess}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Dashboard;