import { business } from '../config/business';
export function getCairoStatus(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: business.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday') ?? '');
  const minute = Number(part('hour')) * 60 + Number(part('minute'));
  const hours = business.hours.days.find((entry) => entry.day === day)!;
  return { day, isOpen: minute >= hours.opens && minute < hours.closes, hours };
}
