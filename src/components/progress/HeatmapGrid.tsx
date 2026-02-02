import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapDay {
  date: string;
  value: number; // 0-4 intensity
  label?: string;
}

interface HeatmapGridProps {
  data: HeatmapDay[];
  days?: number;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({ data, days = 30 }) => {
  // Generate last N days
  const getDays = () => {
    const result: HeatmapDay[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const existing = data.find(d => d.date === dateStr);
      result.push(existing || { date: dateStr, value: 0 });
    }
    
    return result;
  };

  const allDays = getDays();

  const getIntensityClass = (value: number) => {
    if (value === 0) return 'bg-muted';
    if (value === 1) return 'bg-success/25';
    if (value === 2) return 'bg-success/50';
    if (value === 3) return 'bg-success/75';
    return 'bg-success';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  // Split into weeks (7 days each)
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  return (
    <div className="space-y-2">
      {/* Grid */}
      <div className="flex gap-1">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {week.map((day) => (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      'h-4 w-4 rounded-sm transition-colors hover:ring-2 hover:ring-ring cursor-pointer',
                      getIntensityClass(day.value)
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{formatDate(day.date)}</p>
                  <p className="text-xs text-muted-foreground">
                    {day.value > 0 ? `${day.label || 'Belajar'}` : 'Tidak belajar'}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Kurang</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-sm bg-muted" />
          <div className="h-3 w-3 rounded-sm bg-success/25" />
          <div className="h-3 w-3 rounded-sm bg-success/50" />
          <div className="h-3 w-3 rounded-sm bg-success/75" />
          <div className="h-3 w-3 rounded-sm bg-success" />
        </div>
        <span>Lebih</span>
      </div>
    </div>
  );
};
