import type { JsonRecord, MessageEntry } from '@/types';

export function buildMessageEntry(data: JsonRecord): MessageEntry | null {
  const { sessionId, timestamp, role, content } = data;

  if (
    typeof sessionId !== 'string' ||
    typeof timestamp !== 'string' ||
    typeof content !== 'string' ||
    typeof role !== 'string' ||
    (role !== 'human' && role !== 'assistant')
  ) {
    return null;
  }

  return {
    sessionId,
    timestamp,
    content,
    role,
  };
}
