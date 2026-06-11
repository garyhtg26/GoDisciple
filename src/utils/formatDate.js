export function formatDate(dateOrTimestamp) {
  if (!dateOrTimestamp) return '';
  const date =
    dateOrTimestamp?.toDate
      ? dateOrTimestamp.toDate()
      : new Date(dateOrTimestamp);

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateOrTimestamp) {
  if (!dateOrTimestamp) return '';
  const date =
    dateOrTimestamp?.toDate
      ? dateOrTimestamp.toDate()
      : new Date(dateOrTimestamp);

  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatRelativeTime(dateOrTimestamp) {
  if (!dateOrTimestamp) return '';
  const date =
    dateOrTimestamp?.toDate
      ? dateOrTimestamp.toDate()
      : new Date(dateOrTimestamp);

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

export function groupByDate(items, dateField = 'startDateTime') {
  const groups = {};
  items.forEach(item => {
    const date = item[dateField]?.toDate
      ? item[dateField].toDate()
      : new Date(item[dateField]);
    const key = date.toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
}
