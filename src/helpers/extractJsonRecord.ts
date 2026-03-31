import type { JsonRecord } from '@/types';
import { isJsonRecord } from './checkTypes';

export function extractJsonRecord(input: string): JsonRecord | null {
  const end = input.lastIndexOf('}');

  if (end < 0) {
    return null;
  }

  let pos = 0;

  while (pos <= end) {
    const start = input.indexOf('{', pos);

    if (start < 0 || start > end) {
      break;
    }

    try {
      const data: unknown = JSON.parse(input.slice(start, end + 1));

      if (isJsonRecord(data)) {
        return data;
      }
    } catch {
      // try next {
    }

    pos = start + 1;
  }

  return null;
}
