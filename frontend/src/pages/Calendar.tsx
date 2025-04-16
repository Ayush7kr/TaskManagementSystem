// src/pages/Calendar.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO // Import parseISO
} from 'date-fns';
import {
    ArrowLeft,
    ArrowRight,
    Plus,
    Loader2, // Import Loader
    AlertTriangle // Import Alert icon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// We don't need the separate Calendar component import if using the grid directly
// import { Calendar } from '@/components/ui/calendar';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TaskCreateForm from '@/components/dashboard/TaskCreateForm';
import { TaskProps, TaskPriority } from '@/components/dashboard/TaskCard'; // Import TaskProps and TaskPriority
import { useUser } from '@/contexts/UserContext'; // Import useUser
import { toast as sonnerToast } from 'sonner'; // Import sonner toast

// Define backend API URL for tasks
const API_TASKS_URL = 'http://localhost:3000/api/tasks';

// Define a type for calendar items combining tasks and other events if needed
// For now, we'll just use tasks
type CalendarItem = TaskProps; // Using TaskProps directly for now

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  // State for fetched tasks, loading, and errors
  const [tasks, setTasks] = useState<TaskProps[]>([]); // Holds fetched tasks
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useUser(); // Get token for auth

  // --- Fetch Tasks Logic ---
  const fetchTasks = useCallback(async () => {
    if (!token) {
      setError("Authentication required.");
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
      setTasks(transformedTasks);
    } catch (err: any) {
      console.error("Error fetching tasks:", err);
      setError(err.message || "An error occurred while fetching tasks.");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // --- useEffect to fetch tasks on mount ---
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // --- Helper to get tasks for a specific date ---
  const getTasksForDate = useCallback((date: Date): TaskProps[] => {
    return tasks.filter(task => isSameDay(task.dueDate, date));
  }, [tasks]); // Re-run only when tasks change

  // --- Calendar Navigation ---
  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleDateSelect = (date: Date) => setSelectedDate(date);

  // --- Task Creation Success Handler ---
   const handleCreateTaskSuccess = (newTaskData: any) => {
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
    setTasks(prev => [...prev, transformedNewTask].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())); // Add and sort
    setCreateDialogOpen(false);
    // Optionally select the due date of the newly created task
    // setSelectedDate(transformedNewTask.dueDate);
  };

  // --- Generate the calendar grid ---
  const renderCalendarGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    // Header row
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    rows.push(
      <div key="header" className="grid grid-cols-7">
        {daysOfWeek.map(d => (
          <div key={`header-${d}`} className="font-medium text-center text-muted-foreground text-sm py-2">
            {d}
          </div>
        ))}
      </div>
    );

    // Date cells
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day; // Capture day for onClick closure
        const formattedDate = format(cloneDay, "d");
        const dayTasks = getTasksForDate(cloneDay); // Get tasks for this specific day

        days.push(
          <div
            key={cloneDay.toString()}
            className={`min-h-[120px] p-2 border relative flex flex-col group transition-colors duration-150 ease-in-out
              ${!isSameMonth(cloneDay, monthStart) ? "text-muted-foreground/60 bg-muted/30" : "bg-background hover:bg-accent/50"}
              ${isSameDay(cloneDay, new Date()) ? "bg-blue-50 dark:bg-blue-900/30" : ""}
              ${isSameDay(cloneDay, selectedDate ?? new Date(0)) ? "ring-2 ring-primary ring-inset" : ""}
            `}
            onClick={() => handleDateSelect(cloneDay)}
          >
            <div className={`font-medium text-sm ${isSameDay(cloneDay, new Date()) ? 'text-primary font-bold' : ''}`}>
              {formattedDate}
            </div>
            {/* Task Markers */}
            <div className="flex-grow mt-1 space-y-1 overflow-hidden">
              {dayTasks.slice(0, 3).map(task => ( // Show max 3 tasks initially
                 <div
                   key={task.id}
                   className={`text-xs rounded px-1.5 py-0.5 truncate cursor-pointer
                   ${task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200' :
                     task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-200' :
                     'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'}
                  `}
                  title={`${task.title} (${task.priority})`} // Tooltip
                 >
                   {task.title}
                 </div>
              ))}
               {dayTasks.length > 3 && ( // Show indicator if more tasks exist
                 <div className="text-xs text-muted-foreground mt-1">
                   + {dayTasks.length - 3} more
                 </div>
               )}
            </div>
            {/* Add Task Button on Hover (optional) */}
             <Button
                variant="ghost"
                size="icon"
                className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent day selection
                    setSelectedDate(cloneDay); // Set selected date for the dialog
                    setCreateDialogOpen(true);
                }}
                title={`Add task for ${format(cloneDay, 'MMM d')}`}
             >
                <Plus size={16} />
            </Button>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={`row-${format(day, 'T')}`} className="grid grid-cols-7 border-t">
          {days}
        </div>
      );
      days = []; // Reset days for next row
    }
    return <div>{rows}</div>;
  };

  // --- Display events for selected date ---
  const renderSelectedDateEvents = () => {
    if (!selectedDate) return null;

    const dateTasks = getTasksForDate(selectedDate);

    return (
      <div className="bg-card rounded-xl p-4 shadow-sm sticky top-[calc(var(--header-height)_+_1.5rem)]"> {/* Make sticky */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b">
          <h3 className="font-semibold text-lg">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h3>
          <Button
             size="sm"
             variant="outline"
             onClick={() => { setSelectedDate(new Date()); setCurrentDate(new Date()); }} // Go to today
             title="Go to Today"
          >
            Today
          </Button>
        </div>

        <div className="max-h-[calc(100vh_-_var(--header-height)_-_10rem)] overflow-y-auto pr-1"> {/* Scrollable area */}
          {dateTasks.length > 0 ? (
            <div className="space-y-3">
              {dateTasks.map(task => (
                <div key={task.id} className="flex items-start p-3 bg-background rounded-lg border gap-3">
                   {/* Priority Indicator */}
                   <span className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                       task.priority === 'high' ? 'bg-red-500' :
                       task.priority === 'medium' ? 'bg-yellow-500' :
                       'bg-green-500'
                   }`} title={`Priority: ${task.priority}`}></span>
                  <div className="flex-grow">
                    <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                    {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                    )}
                  </div>
                   <Badge variant={
                      task.status === 'completed' ? 'outline' : // Use theme color for completed maybe
                      task.status === 'in-progress' ? 'secondary' :
                      'default' // Default might be pending theme color
                   } className="text-xs flex-shrink-0">
                    {task.status.replace('-', ' ')}
                   </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground text-sm">
              No tasks due on this day.
            </p>
          )}
        </div>
        {/* Add Task Button for selected day */}
         <Button
            className="w-full mt-4"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Task for {format(selectedDate, 'MMM d')}
        </Button>
      </div>
    );
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader
        title="Calendar"
        subtitle="View your tasks and deadlines"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

       {/* Error State */}
       {!isLoading && error && (
           <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-destructive/50 bg-destructive/10 rounded-md max-w-2xl mx-auto">
             <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
             <p className="text-destructive font-semibold mb-1">Failed to load calendar tasks</p>
             <p className="text-sm text-destructive/90 mb-4">{error}</p>
             <Button variant="destructive" size="sm" onClick={fetchTasks}>
               Retry
             </Button>
           </div>
       )}

      {/* Calendar View (only show if not loading and no error) */}
      {!isLoading && !error && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Calendar Section */}
          <div className="flex-1 overflow-hidden"> {/* Prevent stretching */}
            <div className="bg-card rounded-xl p-4 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNextMonth} aria-label="Next month">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {renderCalendarGrid()}
            </div>
          </div>

          {/* Selected Date Events */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0"> {/* Adjust width */}
            {renderSelectedDateEvents()}
          </div>
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskCreateForm
            onSubmitSuccess={handleCreateTaskSuccess} // Use the correct prop name
            onCancel={() => setCreateDialogOpen(false)}
            initialDate={selectedDate} // Pass selected date to pre-fill
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CalendarPage;