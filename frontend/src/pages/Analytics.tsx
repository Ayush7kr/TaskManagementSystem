// src/pages/Analytics.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  format,
  subDays,
  startOfDay,
  isSameDay,
  differenceInDays, // Use differenceInDays
  parseISO
} from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    // CheckCircle2, // Not used directly in calculated stats
    AlertCircle,
    Loader2, // Import Loader
    AlertTriangle // Import Alert icon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { TaskProps } from '@/components/dashboard/TaskCard'; // Import TaskProps
import { useUser } from '@/contexts/UserContext'; // Import useUser
import { toast as sonnerToast } from 'sonner'; // Import sonner toast

// Define backend API URL for tasks
const API_TASKS_URL = 'http://localhost:3000/api/tasks';

// Define colors for charts (can be customized)
const STATUS_COLORS = {
    completed: '#10B981', // Emerald 500
    'in-progress': '#3B82F6', // Blue 500
    pending: '#F59E0B' // Amber 500
};

const PRIORITY_COLORS = {
    high: '#EF4444', // Red 500
    medium: '#F59E0B', // Amber 500
    low: '#10B981' // Emerald 500
};

const Analytics = () => {
  // State for fetched tasks, loading, and errors
  const [tasks, setTasks] = useState<TaskProps[]>([]);
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        dueDate: parseISO(task.dueDate),
        priority: task.priority,
        status: task.status,
        assignee: task.assignee,
        createdAt: task.createdAt ? parseISO(task.createdAt) : new Date(0), // Default if missing
        updatedAt: task.updatedAt ? parseISO(task.updatedAt) : new Date(0), // Default if missing
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

  // --- Calculate Analytics Data using useMemo ---
  const analyticsData = useMemo(() => {
    if (tasks.length === 0) {
      // Return default/empty state if no tasks
      return {
        completionRate: 0,
        avgCompletionTimeDays: 0,
        overdueCount: 0,
        overdueRate: 0,
        taskCompletionData: [],
        taskStatusData: [],
        taskPriorityData: [],
        // Add default 0 values for counts if needed elsewhere
        totalTasks: 0,
        completedCount: 0,
        inProgressCount: 0,
        pendingCount: 0,
        highPriorityCount: 0,
        mediumPriorityCount: 0,
        lowPriorityCount: 0,
      };
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completedCount = completedTasks.length;
    const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
    const pendingCount = tasks.filter(t => t.status === 'pending').length;

    const highPriorityCount = tasks.filter(t => t.priority === 'high').length;
    const mediumPriorityCount = tasks.filter(t => t.priority === 'medium').length;
    const lowPriorityCount = tasks.filter(t => t.priority === 'low').length;

    // --- Completion Rate ---
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    // --- Average Completion Time ---
    let totalCompletionTimeDays = 0;
    let validCompletionCount = 0;
    completedTasks.forEach(task => {
      // Ensure both dates are valid before calculating difference
       if (task.createdAt && task.updatedAt && task.createdAt.getTime() > 0 && task.updatedAt.getTime() > 0) {
           // Using updatedAt as completion time - **important assumption**
           const completionTime = differenceInDays(task.updatedAt, task.createdAt);
           // Ignore potentially negative times if updatedAt is somehow before createdAt
           if (completionTime >= 0) {
               totalCompletionTimeDays += completionTime;
               validCompletionCount++;
           }
       }
    });
    const avgCompletionTimeDays = validCompletionCount > 0 ? parseFloat((totalCompletionTimeDays / validCompletionCount).toFixed(1)) : 0;

    // --- Overdue Rate ---
    const today = startOfDay(new Date());
    const overdueCount = tasks.filter(t => t.dueDate < today && t.status !== 'completed').length;
    const overdueRate = totalTasks > 0 ? Math.round((overdueCount / totalTasks) * 100) : 0; // Rate among all tasks


    // --- Task Completion Over Time (Last 7 Days) ---
    const taskCompletionData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const added = tasks.filter(t => t.createdAt && isSameDay(t.createdAt, date)).length;
       // Using updatedAt again as completion time proxy
      const completed = tasks.filter(t => t.status === 'completed' && t.updatedAt && isSameDay(t.updatedAt, date)).length;
      taskCompletionData.push({
        date: format(date, 'MMM d'),
        completed: completed,
        added: added,
      });
    }

    // --- Task Distribution Data for Pie Charts ---
    const taskStatusData = [
      { name: 'Completed', value: completedCount, color: STATUS_COLORS.completed },
      { name: 'In Progress', value: inProgressCount, color: STATUS_COLORS['in-progress'] },
      { name: 'Pending', value: pendingCount, color: STATUS_COLORS.pending },
    ].filter(d => d.value > 0); // Filter out zero values for cleaner chart

    const taskPriorityData = [
      { name: 'High', value: highPriorityCount, color: PRIORITY_COLORS.high },
      { name: 'Medium', value: mediumPriorityCount, color: PRIORITY_COLORS.medium },
      { name: 'Low', value: lowPriorityCount, color: PRIORITY_COLORS.low },
    ].filter(d => d.value > 0); // Filter out zero values

    return {
      completionRate,
      avgCompletionTimeDays,
      overdueCount,
      overdueRate,
      taskCompletionData,
      taskStatusData,
      taskPriorityData,
      // Expose counts if needed
      totalTasks,
      completedCount,
      inProgressCount,
      pendingCount,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount,
    };
  }, [tasks]); // Recalculate when tasks change


  // Placeholder function for rendering Pie chart labels
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Position label inside slice
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentage = (percent * 100).toFixed(0);

    // Don't render label if percentage is too small
    if (percent < 0.05) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12px" fontWeight="bold">
        {`${name} ${percentage}%`}
      </text>
    );
  };


  return (
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader
        title="Analytics"
        subtitle="Track your task performance and productivity"
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
             <p className="text-destructive font-semibold mb-1">Failed to load analytics data</p>
             <p className="text-sm text-destructive/90 mb-4">{error}</p>
             <Button variant="destructive" size="sm" onClick={fetchTasks}>
               Retry
             </Button>
           </div>
       )}

       {/* Analytics Content (only show if not loading and no error) */}
       {!isLoading && !error && (
         <>
           {/* Metrics Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">
                   Task Completion Rate
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex justify-between items-center">
                   <div className="text-2xl font-bold">{analyticsData.completionRate}%</div>
                    {/* Trend data requires historical comparison - removed for now */}
                    {/* <div className={`flex items-center text-green-500`}> <ArrowUpRight className="h-4 w-4 mr-1" /> <span className="text-sm">N/A</span> </div> */}
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">Percentage of all tasks completed</p>
               </CardContent>
             </Card>

             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">
                   Avg. Completion Time
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex justify-between items-center">
                   <div className="text-2xl font-bold flex items-center">
                     <Clock className="h-5 w-5 mr-2 text-blue-500" />
                     {analyticsData.avgCompletionTimeDays} days
                   </div>
                   {/* Trend data requires historical comparison - removed for now */}
                   {/* <div className={`flex items-center text-green-500`}> <ArrowUpRight className="h-4 w-4 mr-1" /> <span className="text-sm">N/A</span> </div> */}
                 </div>
                  <p className="text-xs text-muted-foreground mt-1">
                      Average time from creation to completion
                      {analyticsData.completedCount === 0 ? ' (No completed tasks)' : ''}
                  </p>
               </CardContent>
             </Card>

             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">
                   Overdue Rate
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex justify-between items-center">
                   <div className="text-2xl font-bold flex items-center">
                     <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                     {analyticsData.overdueRate}%
                   </div>
                   {/* Trend data requires historical comparison - removed for now */}
                   {/* <div className={`flex items-center text-green-500`}> <ArrowUpRight className="h-4 w-4 mr-1" /> <span className="text-sm">N/A</span> </div> */}
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">Percentage of all tasks overdue</p>
               </CardContent>
             </Card>
           </div>

           {/* Charts */}
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
             {/* Task Completion Over Time */}
             <Card className="xl:col-span-2">
               <CardHeader>
                 <CardTitle>Activity (Last 7 Days)</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-80">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={analyticsData.taskCompletionData}>
                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                       <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                       <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12}/>
                       <Tooltip
                         contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                         itemStyle={{ color: 'hsl(var(--foreground))' }}
                         labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                       />
                       <Legend wrapperStyle={{fontSize: '12px'}}/>
                       <Bar dataKey="added" name="Tasks Added" fill="#6366F1" radius={[4, 4, 0, 0]} /> {/* Indigo */}
                       <Bar dataKey="completed" name="Tasks Completed" fill="#10B981" radius={[4, 4, 0, 0]} /> {/* Emerald */}
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </CardContent>
             </Card>

             {/* Task Distribution */}
             <Card className="col-span-1">
               <CardHeader>
                 <CardTitle>Task Distribution</CardTitle>
               </CardHeader>
               <CardContent>
                 <Tabs defaultValue="status" className="w-full">
                   <TabsList className="w-full mb-4 grid grid-cols-2"> {/* Use grid for equal width */}
                     <TabsTrigger value="status">By Status</TabsTrigger>
                     <TabsTrigger value="priority">By Priority</TabsTrigger>
                   </TabsList>

                   <TabsContent value="status" className="mt-0">
                     <div className="h-60 w-full flex items-center justify-center"> {/* Center pie chart */}
                       {analyticsData.taskStatusData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={analyticsData.taskStatusData}
                                cx="50%" cy="50%"
                                labelLine={false}
                                // label={renderCustomizedLabel} // Use custom label for better visibility
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                outerRadius={80} innerRadius={40} // Make it a Donut chart
                                fill="#8884d8" dataKey="value"
                                stroke="hsl(var(--background))" // Add stroke for separation
                                strokeWidth={2}
                              >
                                {analyticsData.taskStatusData.map((entry, index) => (
                                  <Cell key={`cell-status-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value, name) => [`${value} tasks`, name]}/>
                               <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '12px', marginTop: '10px'}}/>
                            </PieChart>
                          </ResponsiveContainer>
                       ) : (
                         <p className="text-muted-foreground text-sm">No task data available.</p>
                       )}
                     </div>
                   </TabsContent>

                   <TabsContent value="priority" className="mt-0">
                     <div className="h-60 w-full flex items-center justify-center">
                        {analyticsData.taskPriorityData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                <Pie
                                    data={analyticsData.taskPriorityData}
                                    cx="50%" cy="50%"
                                    labelLine={false}
                                    // label={renderCustomizedLabel}
                                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80} innerRadius={40}
                                    fill="#8884d8" dataKey="value"
                                    stroke="hsl(var(--background))"
                                    strokeWidth={2}
                                >
                                    {analyticsData.taskPriorityData.map((entry, index) => (
                                    <Cell key={`cell-priority-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [`${value} tasks`, name]}/>
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '12px', marginTop: '10px'}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-muted-foreground text-sm">No task data available.</p>
                        )}
                     </div>
                   </TabsContent>
                 </Tabs>
               </CardContent>
             </Card>
           </div>
         </>
       )}
    </DashboardLayout>
  );
};

export default Analytics;