function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function getDateParts(isoTimestamp: string): {
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
} {
  const d = new Date(isoTimestamp);

  return {
    year: String(d.getFullYear()),
    month: pad2(d.getMonth() + 1),
    day: pad2(d.getDate()),
    hours: pad2(d.getHours()),
    minutes: pad2(d.getMinutes()),
    seconds: pad2(d.getSeconds()),
  };
}
