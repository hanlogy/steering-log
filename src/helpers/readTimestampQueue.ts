import { existsSync, readFileSync } from 'fs';

export function readTimestampQueue(path: string): string[] {
  if (!existsSync(path)) {
    return [];
  }

  return readFileSync(path, 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}
