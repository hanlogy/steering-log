import { spawnSync } from 'child_process';
import { DETECTOR_MODEL, SUMMARIZER_MODEL } from '@/constants';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { buildPaths } from './buildPaths';
import type { SpawnAgentParams } from '@/types';

function spawnAgent({
  model,
  prompt,
  agentName,
  cwd,
  attempt,
}: SpawnAgentParams): string | null {
  if (process.env['CLAUDE_PLUGIN_OPTION_DEBUG_PROMPTS'] === 'true') {
    const { conversationDir } = buildPaths(cwd);
    mkdirSync(conversationDir, { recursive: true });
    const logPath = join(conversationDir, `${agentName}-prompts.log`);

    appendFileSync(
      logPath,
      `${new Date().toISOString()}, attempt: ${attempt}\n${prompt}\n\n---\n\n`,
    );
  }

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

export function spawnDetectorAgent(
  options: Pick<SpawnAgentParams, 'attempt' | 'cwd' | 'prompt'>,
): string | null {
  return spawnAgent({
    model: DETECTOR_MODEL,
    agentName: 'detector',
    ...options,
  });
}

export function spawnSummarizerAgent(
  options: Pick<SpawnAgentParams, 'attempt' | 'cwd' | 'prompt'>,
): string | null {
  return spawnAgent({
    model: SUMMARIZER_MODEL,
    agentName: 'summarizer',
    ...options,
  });
}
