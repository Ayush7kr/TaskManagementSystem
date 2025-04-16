
import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Calendar, User, MoreVertical } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface TaskProps {
  id: string; // Use 'id' instead of '_id' in the frontend component
  title: string;
  description?: string;
  dueDate: Date; // Store as Date object
  priority: TaskPriority;
  status: TaskStatus;
  assignee?: string;
  createdAt?: Date; // Optional: if you want to display creation date
  updatedAt?: Date; // Optional: if you want to display update date
  // Add createdBy if needed, though maybe not directly displayed on the card
}

interface TaskCardProps {
  task: TaskProps;
  onClick?: () => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onClick, 
  onStatusChange 
}) => {
  const priorityColor = {
    high: 'bg-task-high text-white',
    medium: 'bg-task-medium text-white',
    low: 'bg-task-low text-white'
  };

  const statusColor = {
    'pending': 'bg-blue-light text-blue-dark',
    'in-progress': 'bg-teal text-primary-foreground',
    'completed': 'bg-task-completed text-white'
  };

  const isOverdue = task.dueDate < new Date() && task.status !== 'completed';

  return (
    <Card 
      className={cn(
        "task-card card-hover border-l-4",
        {
          "border-l-task-high": task.priority === 'high',
          "border-l-task-medium": task.priority === 'medium',
          "border-l-task-low": task.priority === 'low',
          "border-l-task-completed": task.status === 'completed'
        }
      )}
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-0 flex flex-row justify-between items-start space-y-0">
        <div>
          <h3 className="font-medium line-clamp-1">{task.title}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2">
              <MoreVertical size={16} />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'pending')}>
              Mark as Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'in-progress')}>
              Mark as In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange?.(task.id, 'completed')}>
              Mark as Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className={priorityColor[task.priority]}>
            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
          </Badge>
          <Badge variant="outline" className={statusColor[task.status]}>
            {task.status.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          <span>{isOverdue ? 'Overdue' : 'Due'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>{format(task.dueDate, 'MMM d, yyyy')}</span>
        </div>
        {task.assignee && (
          <div className="flex items-center gap-1 ml-auto">
            <User size={14} />
            <span>{task.assignee}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
