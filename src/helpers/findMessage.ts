import type { ConversationRole, MessageEntry } from '@/types';

export function findMessage(
  messages: readonly MessageEntry[],
  {
    role,
    type,
  }: {
    role: ConversationRole;
    type: 'newest' | 'oldest';
  },
): MessageEntry | null {
  if (type === 'oldest') {
    return messages.find((m) => m.role === role) ?? null;
  }

  return (
    messages
      .slice()
      .reverse()
      .find((m) => m.role === role) ?? null
  );
}
