import type { JsonRecord } from '@/types';
import { readFileSync } from 'fs';
import { isJsonRecord } from './checkTypes';

export function readJsonRecord(path: string): JsonRecord | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf-8'));

    if (isJsonRecord(parsed)) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}
