import type { JsonRecord } from '@/types';
import { isJsonRecord } from './checkTypes';

export function extractJsonRecord(input: string): JsonRecord | null {
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== '{') {
      continue;
    }

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let j = i; j < input.length; j++) {
      const ch = input[j];

      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\' && inString) {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) {
        continue;
      }

      if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            const data: unknown = JSON.parse(input.slice(i, j + 1));
            if (isJsonRecord(data)) {
              return data;
            }
          } catch {
            // balanced but not valid JSON — try next {
          }
          break;
        }
      }
    }
  }

  return null;
}
