import { writeFileSync } from 'fs';

export function writeContextFile(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2));
}
