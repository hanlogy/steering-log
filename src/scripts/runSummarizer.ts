import { buildPaths } from '@/helpers/buildPaths';
import { parseSummarizerAgentOutput } from '@/helpers/parseSummarizerAgentOutput';
import { AGENT_MAX_RETRIES, QUALIFICATION_RULES_PLACEHOLDER } from '@/constants';
import { advanceSummarizer } from '@/helpers/advanceSummarizer';
import { buildEpisodeFileName } from '@/helpers/buildEpisodeFileName';
import { findLatestEpisode } from '@/helpers/findLatestEpisode';
import { spawnSummarizerAgent } from '@/helpers/spawnAgents';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { SummarizerAgentOutput, SummarizerContext } from '@/types';
import { completeEpisode } from '@/helpers/completeEpisode';
import { writeMoment } from '@/helpers/writeMoment';
import { writeTranscript } from '@/helpers/writeTranscript';
import { findMessage } from '@/helpers/findMessage';
import summarizerPrompt from '@/prompts/summarizer.md';
import momentRules from '@/prompts/shared/momentRules.md';

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

    const parsed = runSummarizerWithRetry(
      cwd,
      buildPrompt(context, episodeContent),
    );

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

    if (process.env['CLAUDE_PLUGIN_OPTION_SAVE_TRANSCRIPT'] === 'true') {
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

function runSummarizerWithRetry(
  cwd: string,
  prompt: string,
): SummarizerAgentOutput | null {
  let agentOutput = parseSummarizerAgentOutput(
    spawnSummarizerAgent({ cwd, prompt, attempt: 1 }),
  );

  for (
    let attempt = 2;
    agentOutput === null && attempt <= AGENT_MAX_RETRIES + 1;
    attempt++
  ) {
    agentOutput = parseSummarizerAgentOutput(
      spawnSummarizerAgent({ cwd, prompt, attempt }),
    );
  }

  return agentOutput;
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
    : 'There is no current episode yet.';

  const prompt = summarizerPrompt
    .replace(QUALIFICATION_RULES_PLACEHOLDER, momentRules)
    .replace(
      '{{PREVIOUS_RESULT_INSTRUCTION}}',
      episodeContent
        ? [
            '',
            '## How to write `previous_result`',
            'Only set when `is_new_episode` is true. One of: completed | paused | cancelled | failed — how the previous episode ended.',
          ].join('\n\n')
        : '',
    )
    .replace(
      '{{PREVIOUS_RESULT_JSON}}',
      episodeContent ? '"previous_result": "completed|paused|cancelled|failed", ' : '',
    );

  return `${prompt}

--- Conversation ---

${messages}

--- End of Conversation ---

${episodeSection}`;
}

runSummarizer(cwd);
