import { spawnSync } from 'child_process';
import { HAIKU_MODEL, SONNET_MODEL } from '@/constants';

function spawnAgent({
  model,
  prompt,
}: {
  model: typeof HAIKU_MODEL | typeof SONNET_MODEL;
  prompt: string;
}): string | null {
  const result = spawnSync('claude', ['--print', '--model', model], {
    input: prompt,
    encoding: 'utf8',
    env: {
      ...process.env,
      STEERING_LOG_INTERNAL_RUN: '1',
    },
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout;
}

export function spawnDetectorAgent(prompt: string): string | null {
  return spawnAgent({ model: HAIKU_MODEL, prompt });
}

export function spawnSummarizerAgent(prompt: string): string | null {
  return spawnAgent({ model: SONNET_MODEL, prompt });
}
