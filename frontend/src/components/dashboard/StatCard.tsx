
import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  className
}) => {
  return (
    <Card className={cn("overflow-hidden animate-fade-in", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            
            {trend && (
              <p className={cn(
                "flex items-center text-xs mt-1",
                trend.positive ? "text-task-low" : "text-task-high"
              )}>
                <span>
                  {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="text-muted-foreground ml-1">vs last week</span>
              </p>
            )}
          </div>
          
          <div className="rounded-full p-2 bg-muted">
            <Icon className="text-primary h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
