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
});
