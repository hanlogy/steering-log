import { buildPaths } from '@/helpers/buildPaths';
import { appendFileSync } from 'fs';

export function writeTriggersQueue(
  cwd: string,
  { timestamp }: { timestamp: string },
): void {
  const { triggersQueuePath } = buildPaths(cwd);

  appendFileSync(triggersQueuePath, `${timestamp}\n`);
}
