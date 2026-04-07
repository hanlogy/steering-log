import type {
  EPISODE_RESULTS,
  HOOK_EVENT_NAMES,
  STEERING_TYPES,
} from './constants';

export type PrimitiveValue = string | number | boolean | null;

export type PrimitiveRecord<T extends PrimitiveValue = PrimitiveValue> =
  Readonly<Record<string, T>>;

export type JsonValue =
  | PrimitiveValue
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type JsonRecord = Readonly<Record<string, JsonValue>>;

export type HookEventName = (typeof HOOK_EVENT_NAMES)[number];

export interface StdinPayload {
  readonly sessionId: string;
  readonly cwd: string;
  readonly hookEventName: HookEventName;
  readonly data: JsonRecord;
}

export type ConversationRole = 'human' | 'assistant';

interface BufferEntryCommon {
  readonly sessionId: string;
  readonly timestamp: string;
}

export interface MessageEntry extends BufferEntryCommon {
  readonly role: ConversationRole;
  readonly content: string;
}

export interface CommandEntry extends BufferEntryCommon {
  readonly command: 'clear' | 'compact';
}

export type BufferEntry = MessageEntry | CommandEntry;

export type SteeringType = (typeof STEERING_TYPES)[number];

export interface SummarizerContext {
  readonly isFinished: boolean;
  readonly humanMessages: number;
  readonly assistantMessages: number;
  readonly clearCount: number;
  readonly compactCount: number;
  readonly messages: readonly MessageEntry[];
}

export type EpisodeResults = (typeof EPISODE_RESULTS)[number];

export interface SummarizerAgentOutputBase {
  readonly isMoment: true;
  readonly type: SteeringType;
  readonly judgment: string;
  readonly context: string;
}

export interface SummarizerAgentMomentOutput extends SummarizerAgentOutputBase {
  readonly isNewEpisode: false;
  readonly previousResult?: undefined;
  readonly topic?: undefined;
}

export interface SummarizerAgentEpisodeOutput extends SummarizerAgentOutputBase {
  readonly isNewEpisode: true;
  readonly previousResult: EpisodeResults | undefined;
  readonly topic: string;
}

export type SummarizerAgentOutput =
  | {
      isMoment: false;
    }
  | SummarizerAgentMomentOutput
  | SummarizerAgentEpisodeOutput;

export interface DetectorContext {
  readonly isFinished: boolean;
  readonly messages: readonly MessageEntry[];
}

export interface DetectorAgentOutput {
  readonly isTrigger: boolean;
}
