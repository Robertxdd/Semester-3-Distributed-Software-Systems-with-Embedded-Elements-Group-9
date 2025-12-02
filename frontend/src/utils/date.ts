export const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
};

export const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString();
};

export const minutesToHours = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
};
