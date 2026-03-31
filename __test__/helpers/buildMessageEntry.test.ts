import { buildMessageEntry } from '@/helpers/buildMessageEntry';

function makeInput(overrides = {}) {
  return {
    sessionId: 's',
    timestamp: 't',
    role: 'human',
    content: 'hi',
    ...overrides,
  };
}

describe('buildMessageEntry', () => {
  test('returns MessageEntry for human role', () => {
    expect(buildMessageEntry(makeInput())).toStrictEqual({
      sessionId: 's',
      timestamp: 't',
      role: 'human',
      content: 'hi',
    });
  });

  test('returns MessageEntry for assistant role', () => {
    expect(buildMessageEntry(makeInput({ role: 'assistant' }))).toStrictEqual({
      sessionId: 's',
      timestamp: 't',
      role: 'assistant',
      content: 'hi',
    });
  });

  test('accepts extra fields', () => {
    expect(buildMessageEntry(makeInput({ extra: true }))).toStrictEqual({
      sessionId: 's',
      timestamp: 't',
      role: 'human',
      content: 'hi',
    });
  });

  test.each([
    { sessionId: 123, timestamp: 't', role: 'human', content: 'hi' },
    { sessionId: 's', timestamp: 123, role: 'human', content: 'hi' },
    { sessionId: 's', timestamp: 't', role: 'human', content: 123 },
  ])('returns null when a field has wrong type: %o', (input) => {
    expect(buildMessageEntry(input)).toBeNull();
  });

  test.each([
    { timestamp: 't', role: 'human', content: 'hi' },
    { sessionId: 's', role: 'human', content: 'hi' },
    { sessionId: 's', timestamp: 't', content: 'hi' },
    { sessionId: 's', timestamp: 't', role: 'human' },
  ])('returns null when a required field is missing: %o', (input) => {
    expect(buildMessageEntry(input)).toBeNull();
  });

  test.each(['unknown', '', 'Human', 'ASSISTANT'])(
    'returns null when role is "%s"',
    (role) => {
      expect(buildMessageEntry(makeInput({ role }))).toBeNull();
    },
  );
});
