import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

export function findLatestEpisode(steeringLogDir: string): string | null {
  if (!existsSync(steeringLogDir)) {
    return null;
  }

  const files = readdirSync(steeringLogDir)
    .filter((f) => f.endsWith('.md') && !f.endsWith('.transcript.md'))
    .sort();

  const last = files[files.length - 1];
  return last ? join(steeringLogDir, last) : null;
}
