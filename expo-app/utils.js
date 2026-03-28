const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function getRelativeTime(dateInput) {
  if (!dateInput) return '';

  const now  = new Date();
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return typeof dateInput === 'string' ? dateInput : '';

  const diffMs    = now - date;
  const diffSecs  = Math.floor(diffMs / 1000);
  const diffMins  = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays  = Math.floor(diffHours / 24);

  if (diffSecs  <  60) return 'Just now';
  if (diffMins  <  60) return `${diffMins}m ago`;
  if (diffHours <  24) return `${diffHours}h ago`;
  if (diffDays  <   7) return `${diffDays}d ago`;

  const label = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  return date.getFullYear() === now.getFullYear() ? label : `${label}, ${date.getFullYear()}`;
}
