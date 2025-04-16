// src/components/TaskCreateForm.tsx

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TaskPriority, TaskStatus } from './TaskCard'; // Assuming these types are defined elsewhere
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Loader2 } from 'lucide-react'; // Import Loader2 for loading state
import { format } from 'date-fns';
import { toast as sonnerToast } from 'sonner'; // Use sonner import directly
import { useUser } from '@/contexts/UserContext'; // Import useUser to get token

// Define backend API URL for tasks
const API_TASKS_URL = 'http://localhost:3000/api/tasks';

// Zod schema remains the same
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  dueDate: z.date({ required_error: "Due date is required." }), // Mark as required
  priority: z.enum(['high', 'medium', 'low']),
  status: z.enum(['pending', 'in-progress', 'completed']),
  assignee: z.string().optional(), // Keep assignee optional for now
});

type FormValues = z.infer<typeof formSchema>;

interface TaskCreateFormProps {
  // onSubmit might now be used to trigger actions AFTER successful creation (e.g., refresh list)
  onSubmitSuccess?: (newTask: any) => void; // Pass the created task data back
  onCancel: () => void;
  initialDate?: Date;
}

const TaskCreateForm: React.FC<TaskCreateFormProps> = ({
  onSubmitSuccess,
  onCancel,
  initialDate,
}) => {
  const { token } = useUser(); // Get the auth token from context
  const [isSubmitting, setIsSubmitting] = useState(false); // Add loading state

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: initialDate || new Date(),
      priority: 'medium', // Ensure correct type if TaskPriority is a specific type
      status: 'pending', // Ensure correct type if TaskStatus is a specific type
      assignee: '',
    },
  });

  // Updated handleSubmit to call the backend
  const handleSubmit = async (data: FormValues) => {
    if (!token) {
      sonnerToast.error('Authentication error', { description: 'You must be logged in to create tasks.' });
      return; // Stop if no token
    }

    setIsSubmitting(true); // Start loading indicator

    try {
      const response = await fetch(API_TASKS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include the JWT token in the Authorization header
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            ...data,
            // Ensure date is sent in a format backend expects (ISO string is good)
            dueDate: data.dueDate.toISOString(),
        }),
      });

      const result = await response.json(); // Parse the response JSON

      if (!response.ok) {
        // Throw an error with the message from the backend, or a default one
        throw new Error(result.message || `Failed to create task (${response.status})`);
      }

      // --- Success ---
      sonnerToast.success('Task created successfully!');
      form.reset(); // Reset form fields on success
      if (onSubmitSuccess) {
        onSubmitSuccess(result.task); // Pass the newly created task data back if prop exists
      }
       // Maybe call onCancel() automatically after success? Optional.
       // onCancel();

    } catch (error: any) {
      // --- Error ---
      console.error('Task creation failed:', error);
      sonnerToast.error('Failed to create task', {
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false); // Stop loading indicator
    }
  };

  return (
    <Form {...form}>
      {/* Pass the async handleSubmit function */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* --- Form Fields (remain mostly the same) --- */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter task title" {...field} disabled={isSubmitting}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add description..."
                  className="resize-none"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className="w-full pl-3 text-left font-normal justify-start" // Align left
                         disabled={isSubmitting}
                      >
                        {field.value ? (
                          format(field.value, 'PPP') // e.g., Oct 26, 2023
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                       onSelect={(date) => field.onChange(date || new Date())} // Handle undefined date from calendar
                       disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || isSubmitting} // Disable past dates
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                   disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                   disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assignee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignee (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Assign to..." {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Footer Buttons --- */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                </>
            ) : (
                'Create Task'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TaskCreateForm;