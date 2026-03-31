import { getDateParts } from './getTimeParts';

export function buildEpisodeFileName(
  isoTimestamp: string,
  topic: string,
): string {
  const { year, month, day, hours, minutes, seconds } =
    getDateParts(isoTimestamp);

  const slug = topic
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${[year, month, day, hours, minutes, seconds].join('')}-${slug}.md`;
}
