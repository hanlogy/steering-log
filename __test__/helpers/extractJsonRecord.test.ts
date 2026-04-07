import { extractJsonRecord } from '@/helpers/extractJsonRecord';

describe('extractJsonRecord', () => {
  test('extracts a JSON object from a plain string', () => {
    expect(extractJsonRecord('{"key":"value"}')).toStrictEqual({
      key: 'value',
    });
  });

  test('extracts a JSON object surrounded by text', () => {
    expect(extractJsonRecord('prefix {"key":"value"} suffix')).toStrictEqual({
      key: 'value',
    });
  });

  test('returns the outermost object when nested objects are present', () => {
    expect(extractJsonRecord('text {"a":{"b":1}} more')).toStrictEqual({
      a: { b: 1 },
    });
  });

  test('returns null when no braces are present', () => {
    expect(extractJsonRecord('no json here')).toBeNull();
  });

  test('returns null when only opening brace is present', () => {
    expect(extractJsonRecord('just a { here')).toBeNull();
  });

  test('returns null for an empty string', () => {
    expect(extractJsonRecord('')).toBeNull();
  });

  test('returns null for invalid JSON between braces', () => {
    expect(extractJsonRecord('{not valid json}')).toBeNull();
  });

  test('handles an empty object', () => {
    expect(extractJsonRecord('{}')).toStrictEqual({});
  });

  test('extracts JSON that appears after code containing braces', () => {
    const input =
      '```typescript\nfunction sum() { return 0; }\n```\n\n```json\n{"is_moment":true}\n```';

    expect(extractJsonRecord(input)).toStrictEqual({ is_moment: true });
  });

  test('extracts JSON when a stray closing brace follows it', () => {
    expect(extractJsonRecord('{"key":"value"} trailing }')).toStrictEqual({
      key: 'value',
    });
  });

  test('extracts JSON when code with braces follows it', () => {
    const input = '{"is_moment":false}\n\n() => { return 0; }';

    expect(extractJsonRecord(input)).toStrictEqual({ is_moment: false });
  });

  test('extracts JSON whose string value contains braces when a stray brace follows', () => {
    expect(extractJsonRecord('{"msg":"a}b"} trailing }')).toStrictEqual({
      msg: 'a}b',
    });
  });

  test('handles escaped backslash immediately before a closing quote', () => {
    // "path\\" in JSON — the \\ is an escaped backslash, not an escape for the following "
    expect(extractJsonRecord('{"k":"path\\\\"}')).toStrictEqual({
      k: 'path\\',
    });
  });
});
