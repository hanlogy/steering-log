import type { SummarizerContext } from '@/types';
import { existsSync } from 'fs';
import { readJsonRecord } from './readJsonRecord';
import { buildSummarizerContext } from './buildSummarizerContext';

export function readSummarizerContext(path: string): SummarizerContext | null {
  if (!existsSync(path)) {
    return null;
  }

  const record = readJsonRecord(path);
  return record ? buildSummarizerContext(record) : null;
}
