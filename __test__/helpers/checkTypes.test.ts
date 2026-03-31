import {
  isJsonArray,
  isJsonRecord,
  isJsonValue,
  isOneOf,
  isOptionalString,
  isPlainObject,
  isPrimitive,
} from '@/helpers/checkTypes';

describe('isPrimitive', () => {
  test('returns true for null, boolean, number, string', () => {
    expect(isPrimitive(null)).toBe(true);
    expect(isPrimitive(false)).toBe(true);
    expect(isPrimitive(0)).toBe(true);
    expect(isPrimitive('')).toBe(true);
    expect(isPrimitive('string')).toBe(true);
    expect(isPrimitive(-1.5)).toBe(true);
  });

  test('returns false for undefined, function, object, array', () => {
    expect(isPrimitive(undefined)).toBe(false);
    expect(isPrimitive(() => {})).toBe(false);
    expect(isPrimitive({})).toBe(false);
    expect(isPrimitive([1])).toBe(false);
  });
});

describe('isPlainObject', () => {
  test('returns true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
  });

  test('returns false for non-objects', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject(1)).toBe(false);
    expect(isPlainObject('string')).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
  });
});

describe('isJsonValue', () => {
  test('returns true for primitives, arrays, and records', () => {
    expect(isJsonValue(null)).toBe(true);
    expect(isJsonValue(1)).toBe(true);
    expect(isJsonValue('str')).toBe(true);
    expect(isJsonValue(true)).toBe(true);
    expect(isJsonValue([])).toBe(true);
    expect(isJsonValue({ a: 1 })).toBe(true);
  });

  test('returns false for undefined, function, class instance', () => {
    expect(isJsonValue(undefined)).toBe(false);
    expect(isJsonValue(() => {})).toBe(false);
    expect(isJsonValue(new Date())).toBe(false);
  });
});

describe('isJsonRecord', () => {
  test('returns true for plain objects with JSON values', () => {
    expect(isJsonRecord({})).toBe(true);
    expect(isJsonRecord({ a: { b: { c: 1 } } })).toBe(true);
    expect(isJsonRecord({ list: [1, 2, { nested: true }] })).toBe(true);
  });

  test('returns false for primitives and arrays', () => {
    expect(isJsonRecord()).toBe(false);
    expect(isJsonRecord(null)).toBe(false);
    expect(isJsonRecord(true)).toBe(false);
    expect(isJsonRecord(1)).toBe(false);
    expect(isJsonRecord('hello')).toBe(false);
    expect(isJsonRecord([])).toBe(false);
  });

  test('returns false when values are not JSON-safe', () => {
    expect(isJsonRecord({ key: undefined })).toBe(false);
    expect(isJsonRecord({ key: () => {} })).toBe(false);
    expect(isJsonRecord({ key: Symbol() })).toBe(false);
    expect(isJsonRecord({ key: new Date() })).toBe(false);
  });
});

describe('isJsonArray', () => {
  test('returns true for arrays with JSON values', () => {
    expect(isJsonArray([])).toBe(true);
    expect(isJsonArray([1, 'str', null, true, {}, []])).toBe(true);
  });

  test('returns false for non-arrays', () => {
    expect(isJsonArray(undefined)).toBe(false);
    expect(isJsonArray(null)).toBe(false);
    expect(isJsonArray({})).toBe(false);
    expect(isJsonArray('string')).toBe(false);
  });

  test('returns false when elements are not JSON-safe', () => {
    expect(isJsonArray([undefined])).toBe(false);
    expect(isJsonArray([() => {}])).toBe(false);
  });
});

describe('isOptionalString', () => {
  test('returns true for string and undefined', () => {
    expect(isOptionalString(undefined)).toBe(true);
    expect(isOptionalString('')).toBe(true);
    expect(isOptionalString('hello')).toBe(true);
  });

  test('returns false for non-string values', () => {
    expect(isOptionalString(null)).toBe(false);
    expect(isOptionalString(1)).toBe(false);
    expect(isOptionalString({})).toBe(false);
  });
});

describe('isOneOf', () => {
  const VALUES = ['a', 'b', 'c'] as const;

  test('returns true when item is in the array', () => {
    expect(isOneOf(VALUES, 'a')).toBe(true);
    expect(isOneOf(VALUES, 'c')).toBe(true);
  });

  test('returns false when item is not in the array', () => {
    expect(isOneOf(VALUES, 'd')).toBe(false);
    expect(isOneOf(VALUES, '')).toBe(false);
    expect(isOneOf(VALUES, null)).toBe(false);
  });
});
