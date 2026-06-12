import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownProps {
  className?: string;
}

export const OrderDeadlineCountdown: React.FC<CountdownProps> = ({ className }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      
      const cutoff = 10 * 60 + 30; // 10:30
      const resume = 12 * 60; // 12:00
      
      // Pause period (10:30 - 12:00)
      if (totalMinutes >= cutoff && totalMinutes < resume) {
        setIsExpired(true);
        const minutesUntilResume = resume - totalMinutes;
        const hoursLeft = Math.floor(minutesUntilResume / 60);
        const minsLeft = minutesUntilResume % 60;
        setTimeRemaining(`${hoursLeft}h ${minsLeft}m bis Wiedereröffnung`);
        setIsUrgent(false);
        return;
      }
      
      // Calculate time until next deadline
      let targetMinutes: number;
      if (totalMinutes < cutoff) {
        // Time until today's 10:30 deadline
        targetMinutes = cutoff - totalMinutes;
      } else {
        // After 12:00 - time until tomorrow's 10:30
        const minutesUntilMidnight = (24 * 60) - totalMinutes;
        targetMinutes = minutesUntilMidnight + cutoff;
      }
      
      const hoursLeft = Math.floor(targetMinutes / 60);
      const minsLeft = targetMinutes % 60;
      
      setIsExpired(false);
      setTimeRemaining(`${hoursLeft}h ${minsLeft}m`);
      setIsUrgent(targetMinutes <= 30);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn(
      "flex items-center gap-2 p-3 rounded-lg border transition-all duration-300",
      isExpired && "bg-red-500/10 border-red-500/30",
      isUrgent && !isExpired && "bg-amber-500/10 border-amber-500/30 animate-pulse",
      !isUrgent && !isExpired && "bg-apple/10 border-apple/30",
      className
    )}>
      {isExpired ? (
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
      ) : (
        <Clock className={cn(
          "w-4 h-4 flex-shrink-0",
          isUrgent ? "text-amber-500" : "text-apple"
        )} />
      )}
      
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          isExpired && "text-red-500",
          isUrgent && !isExpired && "text-amber-500",
          !isUrgent && !isExpired && "text-apple"
        )}>
          {isExpired ? 'Bestellung Geschlossen' : 'Zeit bis Bestellschluss'}
        </div>
        <div className={cn(
          "text-sm font-bold",
          isExpired && "text-red-600",
          isUrgent && !isExpired && "text-amber-600",
          !isUrgent && !isExpired && "text-apple"
        )}>
          {timeRemaining}
        </div>
      </div>
    </div>
  );
};
