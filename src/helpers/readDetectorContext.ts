import type { DetectorContext } from '@/types';
import { existsSync } from 'fs';
import { readJsonRecord } from './readJsonRecord';
import { buildDetectorContext } from './buildDetectorContext';

export function readDetectorContext(path: string): DetectorContext | null {
  if (!existsSync(path)) {
    return null;
  }

  const record = readJsonRecord(path);
  return record ? buildDetectorContext(record) : null;
}
