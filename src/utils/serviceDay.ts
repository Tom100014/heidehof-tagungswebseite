export const computeServiceDay = (date: Date = new Date()): string => {
  const d = new Date(date);
  const cutoff = new Date(d);
  // Service day boundary at 10:30 local time
  cutoff.setHours(10, 30, 0, 0);
  const result = new Date(d);
  // After 10:30, count towards next service day
  if (d > cutoff) {
    result.setDate(result.getDate() + 1);
  }
  // Return YYYY-MM-DD
  return result.toISOString().split('T')[0];
};
