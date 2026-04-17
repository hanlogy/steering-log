import { advanceDetector } from '@/helpers/advanceDetector';
import { findMessage } from '@/helpers/findMessage';
import { writeTriggersQueue } from '@/helpers/writeTriggersQueue';
import { parseDetectorAgentOutput } from '@/helpers/parseDetectorAgentOutput';
import { spawnSummarizerScript } from '@/helpers/spawnScripts';
import { spawnDetectorAgent } from '@/helpers/spawnAgents';
import { AGENT_MAX_RETRIES, QUALIFICATION_RULES_PLACEHOLDER } from '@/constants';
import type { DetectorAgentOutput } from '@/types';
import systemPrompt from '@/prompts/detector.md';
import momentRules from '@/prompts/shared/momentRules.md';

const cwd = process.argv[2];

if (!cwd) {
  process.exit(0);
}

export function runDetector(cwd: string): void {
  let context = advanceDetector(cwd);
  let lastTimestamp: string | null = null;

  const advance = (): void => {
    context = advanceDetector(cwd, { force: true });
  };

  while (context !== null) {
    const humanMessage = findMessage(context.messages, {
      role: 'human',
      type: 'newest',
    });

    if (!humanMessage || humanMessage.timestamp === lastTimestamp) {
      break;
    }

    lastTimestamp = humanMessage.timestamp;

    const agentOutput = runDetectorWithRetry(
      cwd,
      buildPrompt(context.messages),
    );

    if (agentOutput === null) {
      advance();
      continue;
    }

    if (agentOutput.isTrigger) {
      writeTriggersQueue(cwd, { timestamp: humanMessage.timestamp });
      spawnSummarizerScript(cwd);
    }

    advance();
  }
}

function runDetectorWithRetry(
  cwd: string,
  prompt: string,
): DetectorAgentOutput | null {
  let agentOutput = parseDetectorAgentOutput(
    spawnDetectorAgent({ cwd, prompt, attempt: 1 }),
  );

  for (
    let attempt = 2;
    agentOutput === null && attempt <= AGENT_MAX_RETRIES + 1;
    attempt++
  ) {
    agentOutput = parseDetectorAgentOutput(
      spawnDetectorAgent({ cwd, prompt, attempt }),
    );
  }

  return agentOutput;
}

function buildPrompt(
  messages: readonly { role: string; content: string }[],
): string {
  const conversation = messages
    .map(({ role, content }) => `[${role}]: ${content}`)
    .join('\n\n');

  const prompt = systemPrompt.replace(QUALIFICATION_RULES_PLACEHOLDER, momentRules);

  return `\
${prompt}

--- Conversation ---

${conversation}

--- End of Conversation ---`;
}

runDetector(cwd);
