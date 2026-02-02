import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-full gradient-streak text-warning-foreground font-bold shadow-lg',
        sizeClasses[size]
      )}
    >
      <Flame className={cn(iconSizes[size], 'mb-0.5')} />
      <span>{streak}</span>
    </div>
  );
};
