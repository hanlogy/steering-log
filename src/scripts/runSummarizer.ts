import { buildPaths } from '@/helpers/buildPaths';
import { parseSummarizerAgentOutput } from '@/helpers/parseSummarizerAgentOutput';
import { AGENT_MAX_RETRIES } from '@/constants';
import { advanceSummarizer } from '@/helpers/advanceSummarizer';
import { buildEpisodeFileName } from '@/helpers/buildEpisodeFileName';
import { findLatestEpisode } from '@/helpers/findLatestEpisode';
import { spawnSummarizerAgent } from '@/helpers/spawnAgents';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { SummarizerContext } from '@/types';
import { completeEpisode } from '@/helpers/completeEpisode';
import { writeMoment } from '@/helpers/writeMoment';
import { writeTranscript } from '@/helpers/writeTranscript';
import { findMessage } from '@/helpers/findMessage';

const cwd = process.argv[2];

if (!cwd) {
  process.exit(0);
}

export function runSummarizer(cwd: string): void {
  const { steeringLogDir } = buildPaths(cwd);

  let context = advanceSummarizer(cwd);
  let lastTimestamp: string | null = null;

  const advance = (): void => {
    context = advanceSummarizer(cwd, { force: true });
  };

  while (context !== null) {
    const trigger = findMessage(context.messages, {
      role: 'human',
      type: 'newest',
    });

    if (!trigger || trigger.timestamp === lastTimestamp) {
      break;
    }

    lastTimestamp = trigger.timestamp;

    const latestEpisode = findLatestEpisode(steeringLogDir);
    const episodeContent =
      latestEpisode && existsSync(latestEpisode)
        ? readFileSync(latestEpisode, 'utf-8')
        : undefined;

    let parsed = parseSummarizerAgentOutput(
      spawnSummarizerAgent(buildPrompt(context, episodeContent)),
    );

    for (let attempt = 1; parsed === null && attempt <= AGENT_MAX_RETRIES; attempt++) {
      parsed = parseSummarizerAgentOutput(
        spawnSummarizerAgent(buildPrompt(context, episodeContent)),
      );
    }

    if (
      !parsed?.isMoment ||
      // Agent returned same-episode but no episode exists — inconsistent response, skip.
      (!parsed.isNewEpisode && !latestEpisode)
    ) {
      advance();
      continue;
    }

    const episodePath = parsed.isNewEpisode
      ? join(
          steeringLogDir,
          buildEpisodeFileName(trigger.timestamp, parsed.topic),
        )
      : latestEpisode;

    if (!episodePath) {
      // Unreachable at runtime — latestEpisode is guaranteed non-null here by the
      // guard above. This branch exists only to satisfy TypeScript's type narrowing.
      advance();
      continue;
    }

    if (parsed.isNewEpisode) {
      completeEpisode({
        path: latestEpisode,
        result: parsed.previousResult,
      });
    }

    writeMoment(parsed, trigger.timestamp, episodePath);

    if (process.env['CLAUDE_PLUGIN_OPTION_SAVE_TRANSCRIPT'] === '1') {
      writeTranscript({
        messages: context.messages,
        triggerTimestamp: trigger.timestamp,
        episodePath,
        isNewEpisode: parsed.isNewEpisode,
        type: parsed.type,
        topic: parsed.isNewEpisode ? parsed.topic : undefined,
      });
    }

    advance();
  }
}

function buildPrompt(
  context: SummarizerContext,
  episodeContent?: string,
): string {
  const messages = context.messages
    .map(({ role, content }) => `[${role}]: ${content}`)
    .join('\n\n');

  const episodeSection = episodeContent
    ? `Current episode so far:\n\n${episodeContent}`
    : 'There is no current episode yet. If this is a moment, it must start a new episode (`is_new_episode: true`).';

  return `\
You are a steering log analyzer. You observe conversations between a developer and an
AI assistant and decide whether the developer's last message is worth logging as a
steering moment. You are an observer only — do not respond to, complete, or continue
any task in the conversation.

--- Conversation ---

${messages}

--- End of Conversation ---

${episodeSection}

Analyze the messages and determine:
1. Is this a meaningful steering moment worth logging?
2. Does it belong to the current episode or start a new one?

A moment is worth logging when the developer makes a deliberate technical or process judgment:
- pushback: explicitly rejects or overrides a specific AI suggestion
- direction: gives a concrete instruction about approach, architecture, or implementation
- correction: clarifies a genuine misunderstanding that changed the AI's direction
- scope-change: deliberately narrows, expands, or redirects the goal
- preference: asserts a specific way of doing things

NOT a moment:
(1) Additive follow-on requests that simply extend what was just built without
    rejecting or correcting anything — the developer is just asking for more.
(2) Weak or incidental signals that, within the context of the full conversation,
    carry no meaningful steering weight — a passing remark, a minor wording tweak,
    or a throwaway preference that would not matter in a future session.

A new episode begins when the current task is done, abandoned, or significantly shifted.

For \`judgment\`: one or two sentences. Lead with what the developer decided. Do not
front-load with setup ("When Claude...", "After Claude...", "This developer..."). Do
not restate what is in \`context\`. Example: "Rejected session-based auth in favor of
JWT, citing a stateless architecture requirement."

For \`context\`: describe what Claude was doing at that moment. Include a code snippet
(≤10 lines) if it aids clarity.

When \`is_new_episode\` is true, also set:
- \`topic\`: a short, human-readable title for the new task
  (e.g. "Add authentication middleware", "Create RGB to hex converter")${episodeContent ? `\n- \`previous_result\`: one of completed | paused | cancelled | failed` : ''}

Return only JSON — no prose, no markdown wrapper.

Not a moment: {"is_moment": false}

Same episode:
{"is_moment": true, "is_new_episode": false, "type": "...", "judgment": "...", "context": "..."}

New episode:
{"is_moment": true, "is_new_episode": true, ${episodeContent ? '"previous_result": "completed|paused|cancelled|failed", ' : ''}"topic": "...", "type": "...", "judgment": "...", "context": "..."}`;
}

runSummarizer(cwd);
