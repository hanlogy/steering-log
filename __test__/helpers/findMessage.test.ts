import { findMessage } from '@/helpers/findMessage';
import type { MessageEntry } from '@/types';

const MESSAGES: MessageEntry[] = [
  {
    sessionId: '1',
    timestamp: '2026-01-01T08:50:00.000Z',
    role: 'human',
    content: 'first human',
  },
  {
    sessionId: '1',
    timestamp: '2026-01-01T09:00:00.000Z',
    role: 'assistant',
    content: 'first assistant',
  },
  {
    sessionId: '1',
    timestamp: '2026-01-01T09:50:00.000Z',
    role: 'human',
    content: 'second human',
  },
  {
    sessionId: '1',
    timestamp: '2026-01-01T10:00:00.000Z',
    role: 'assistant',
    content: 'second assistant',
  },
];

describe('findMessage', () => {
  describe('oldest', () => {
    test('returns oldest human message', () => {
      const result = findMessage(MESSAGES, { role: 'human', type: 'oldest' });

      expect(result?.content).toBe('first human');
    });

    test('returns oldest assistant message', () => {
      const result = findMessage(MESSAGES, {
        role: 'assistant',
        type: 'oldest',
      });

      expect(result?.content).toBe('first assistant');
    });

    test('returns null when no match', () => {
      const result = findMessage([], { role: 'human', type: 'oldest' });

      expect(result).toBeNull();
    });
  });

  describe('newest', () => {
    test('returns newest human message', () => {
      const result = findMessage(MESSAGES, { role: 'human', type: 'newest' });

      expect(result?.content).toBe('second human');
    });

    test('returns newest assistant message', () => {
      const result = findMessage(MESSAGES, {
        role: 'assistant',
        type: 'newest',
      });

      expect(result?.content).toBe('second assistant');
    });

    test('returns null when no match', () => {
      const result = findMessage([], { role: 'human', type: 'newest' });

      expect(result).toBeNull();
    });
  });
});
