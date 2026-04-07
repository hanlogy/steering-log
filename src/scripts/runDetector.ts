import { advanceDetector } from '@/helpers/advanceDetector';
import { findMessage } from '@/helpers/findMessage';
import { writeTriggersQueue } from '@/helpers/writeTriggersQueue';
import { parseDetectorAgentOutput } from '@/helpers/parseDetectorAgentOutput';
import { spawnSummarizerScript } from '@/helpers/spawnScripts';
import { spawnDetectorAgent } from '@/helpers/spawnAgents';
import { AGENT_MAX_RETRIES } from '@/constants';

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

    let agentOutput = parseDetectorAgentOutput(
      spawnDetectorAgent(buildPrompt(context.messages)),
    );

    for (let attempt = 1; agentOutput === null && attempt <= AGENT_MAX_RETRIES; attempt++) {
      agentOutput = parseDetectorAgentOutput(
        spawnDetectorAgent(buildPrompt(context.messages)),
      );
    }

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

function buildPrompt(
  messages: readonly { role: string; content: string }[],
): string {
  const formatted = messages
    .map(({ role, content }) => `[${role}]: ${content}`)
    .join('\n\n');

  return `\
${formatted}

You are reviewing a software development conversation.
Determine whether the human message is a meaningful developer steering moment.

A steering moment must reflect a deliberate technical or process judgment:
- pushback: explicitly rejects or overrides a specific AI suggestion with reasoning
  or a counter-position
- direction: gives a concrete instruction about approach, architecture, or implementation
- correction: clarifies a genuine misunderstanding that changed the AI's direction
- scope-change: deliberately narrows, expands, or redirects the goal
- preference: asserts a specific way of doing things ("we use X", "I prefer Y")

Do NOT classify as a trigger:
- Vague disagreement without substance ("I disagree", "that's not right", "are you sure")
- Confusion or requests for clarification ("what?", "huh?", "can you explain")
- Social acknowledgement ("ok", "maybe you're right", "I see")
- Follow-up questions that continue the same topic
- Additive follow-on requests that extend what was just built without rejecting or
  correcting anything ("can we also X?", "how about adding Y?")
- Selecting from options that Claude offered ("yes, option 2", "the second one")

The bar is high. When in doubt, return false.

Return only JSON — no prose, no markdown: {"is_trigger": true} or {"is_trigger": false}.`;
}

runDetector(cwd);
