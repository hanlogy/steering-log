import type { CommandEntry, JsonRecord } from '@/types';

export function buildCommandEntry(data: JsonRecord): CommandEntry | null {
  const { sessionId, timestamp, command } = data;

  if (
    typeof sessionId !== 'string' ||
    typeof timestamp !== 'string' ||
    typeof command !== 'string' ||
    (command !== 'clear' && command !== 'compact')
  ) {
    return null;
  }

  return { sessionId, timestamp, command };
}
