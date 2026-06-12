import { addDays, format } from 'date-fns';

// Determines which menu date to display based on cutoff at 10:30
export function getDisplayMenuDate(now: Date = new Date()): Date {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const cutoff = 10 * 60 + 30; // 10:30
  // After 10:30, show tomorrow's menu; otherwise, today's
  return totalMinutes > cutoff ? addDays(now, 1) : now;
}

// Ordering is open until 10:30 for today, closed 10:30-12:00, open again from 12:00 for tomorrow
export function isConferenceOrderingOpen(now: Date = new Date()): boolean {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const pauseStart = 10 * 60 + 30; // 10:30
  const resume = 12 * 60; // 12:00
  return totalMinutes <= pauseStart || totalMinutes >= resume;
}

export function getConferenceOrderStatus(now: Date = new Date()): {
  isOpen: boolean;
  label: string;
  message: string;
  status: 'today' | 'tomorrow' | 'closed';
} {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const cutoff = 10 * 60 + 30; // 10:30
  const resume = 12 * 60; // 12:00

  if (totalMinutes <= cutoff) {
    return {
      isOpen: true,
      label: 'OFFEN',
      message: 'Bestellungen für HEUTE bis 10:30 Uhr möglich',
      status: 'today'
    };
  }

  if (totalMinutes >= resume) {
    return {
      isOpen: true,
      label: 'OFFEN',
      message: 'Bestellungen für MORGEN bis 10:30 Uhr möglich',
      status: 'tomorrow'
    };
  }

  return {
    isOpen: false,
    label: 'GESCHLOSSEN',
    message: 'Pause: Nächste Bestellmöglichkeit um 12:00 Uhr für morgen',
    status: 'closed'
  };
}

export function formatDateIso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
