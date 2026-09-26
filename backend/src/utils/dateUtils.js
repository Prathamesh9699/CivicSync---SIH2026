/**
 * Date & SLA helper utilities
 */
export const calculateDueDate = (createdAt, hours) => {
  const date = new Date(createdAt || Date.now());
  date.setHours(date.getHours() + hours);
  return date;
};

export const isOverdue = (dueAt) => {
  if (!dueAt) return false;
  return new Date() > new Date(dueAt);
};

export const getHoursRemaining = (dueAt) => {
  if (!dueAt) return 0;
  const diffMs = new Date(dueAt) - new Date();
  return (diffMs / (1000 * 60 * 60)).toFixed(1);
};
