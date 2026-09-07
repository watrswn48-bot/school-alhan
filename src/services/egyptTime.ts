const EGYPT_TIME_ZONE = 'Africa/Cairo';

export function egyptNow(): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EGYPT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value || 0);
  return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
}

export function egyptDateString(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: EGYPT_TIME_ZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function isEgyptFriday(date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: EGYPT_TIME_ZONE, weekday: 'short' }).format(date);
  return parts === 'Fri';
}

export function egyptTimeString(date = new Date()): string {
  return new Intl.DateTimeFormat('ar-EG', {
    timeZone: EGYPT_TIME_ZONE,
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  }).format(date);
}
