import type { EpisodeResults } from '@/types';
import { appendFileSync, existsSync, readFileSync } from 'fs';

export function completeEpisode({
  path,
  result,
}: {
  path: string | null;
  result: EpisodeResults;
}): void {
  if (!path || !existsSync(path)) {
    return;
  }
  const content = readFileSync(path, 'utf-8');
  if (!content.trimEnd().match(/\*\*Result\*\*:\s*\S+\s*$/)) {
    appendFileSync(path, `\n\n---\n\n**Result**: ${result}`);
  }
}
