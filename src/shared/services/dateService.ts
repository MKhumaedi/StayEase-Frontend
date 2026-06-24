/**
 * Date and Timezone service respecting custom user preferences in StayEase.
 */
export function formatWithSettings(
  dateString?: string | Date | null,
  settings?: { timezone?: string; dateFormat?: string } | null,
  includeTime: boolean = false
): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const timezone = settings?.timezone || 'UTC';
  const dateFormat = settings?.dateFormat || 'DD/MM/YYYY';

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const partMap = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {} as Record<string, string>);

    const dd = partMap.day;
    const mm = partMap.month;
    const yyyy = partMap.year;
    const hh = partMap.hour;
    const min = partMap.minute;

    let datePart = '';
    if (dateFormat === 'DD/MM/YYYY') {
      datePart = `${dd}/${mm}/${yyyy}`;
    } else if (dateFormat === 'MM/DD/YYYY') {
      datePart = `${mm}/${dd}/${yyyy}`;
    } else if (dateFormat === 'YYYY-MM-DD') {
      datePart = `${yyyy}-${mm}-${dd}`;
    } else {
      datePart = `${dd}/${mm}/${yyyy}`;
    }

    if (includeTime) {
      return `${datePart} ${hh}:${min}`;
    }
    return datePart;
  } catch (err) {
    console.error('Error formatting date with settings:', err);
    return date.toLocaleDateString();
  }
}
