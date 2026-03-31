import { buildCommandEntry } from '@/helpers/buildCommandEntry';

describe('buildCommandEntry', () => {
  test('valid input returns CommandEntry', () => {
    const input = {
      sessionId: 'abc',
      timestamp: '2025-03-30T12:00:00Z',
      command: 'clear',
    };
    expect(buildCommandEntry(input)).toEqual({
      sessionId: 'abc',
      timestamp: '2025-03-30T12:00:00Z',
      command: 'clear',
    });
  });

  test.each([
    { sessionId: 123, timestamp: 'ts', command: 'clear' },
    { sessionId: 'abc', timestamp: 123, command: 'clear' },
    { sessionId: 'abc', timestamp: 'ts', command: 123 },
  ])('returns null when a field has wrong type: %o', (input) => {
    expect(buildCommandEntry(input)).toBeNull();
  });

  test.each([
    { timestamp: 'ts', command: 'clear' },
    { sessionId: 'abc', command: 'clear' },
    { sessionId: 'abc', timestamp: 'ts' },
    {},
  ])('returns null when a required field is missing: %o', (input) => {
    expect(buildCommandEntry(input)).toBeNull();
  });

  test.each(['unknown', '', 'CLEAR', 'compact '])(
    'returns null when command is "%s"',
    (command) => {
      const input = {
        sessionId: 'abc',
        timestamp: '2025-03-30T12:00:00Z',
        command,
      };
      expect(buildCommandEntry(input)).toBeNull();
    },
  );

  test('accepts extra fields', () => {
    const input = {
      sessionId: 'abc',
      timestamp: 'ts',
      command: 'clear',
      extra: true,
    };
    expect(buildCommandEntry(input)).toEqual({
      sessionId: 'abc',
      timestamp: 'ts',
      command: 'clear',
    });
  });
});
