# steering-log

A Claude Code plugin that automatically detects and logs moments of human
judgment in a Claude Code session — no manual commands, no interruptions.

Every time you push back, redirect, correct, or assert a preference, it gets
captured and written to a structured episode log inside your project.

> **This plugin was built the way it works — a human steering, Claude
> implementing.**

---

## What It Captures

Not every message — only deliberate technical or process judgments:

| Type         | Example                                                         |
| ------------ | --------------------------------------------------------------- |
| pushback     | "Don't extract that into a utility, keep it inline."            |
| direction    | "We're using JWT, not session auth — stateless architecture."   |
| correction   | "No, the issue is in the middleware layer, not the controller." |
| scope-change | "Forget refresh tokens for now, just do access tokens."         |
| preference   | "We always use `pnpm` in this project."                         |

Weak signals are intentionally ignored: vague disagreements, follow-up
questions, social acknowledgements, and additive requests that simply extend
what was just built.

---

## How It Works

The plugin runs entirely in the background via Claude Code hooks. When you send
a message, a fast Detector agent (Haiku) checks whether it's a steering moment.
If it is, a Summarizer agent (Sonnet) reads the conversation window and writes a
structured entry to your episode log — capturing what you decided and why,
without quoting you directly.

Everything is automatic. Claude Code never pauses, never asks for input.

---

## How to install

- [**Install from GitHub repository**](https://github.com/hanlogy/claude-plugins)

---

## What Gets Created in Your Project

```
{your-project}/
└── steering_log/
    ├── .conversation/
    └── 20260327143200-implement-auth-middleware.md
```

- **`.conversation/`** — plugin-internal state; safe to ignore
- **`{datetime}-{slug}.md`** — one file per episode; a new file starts when the
  current task is done, abandoned, or significantly shifted

---

## Log Example

````markdown
# Implement auth middleware

## 2026-03-27 14:32 direction

### Judgment

Rejected session-based auth in favor of JWT, citing a stateless architecture
requirement.

### Context

Claude was about to scaffold session-based auth using express-session.

## 2026-03-27 14:58 pushback

### Judgment

Rejected the proposed abstraction — wanted token verification inlined rather
than extracted into a shared utility before any other callers existed.

### Context

Claude proposed extracting token verification into a reusable utility
(`src/lib/auth/verifyToken.ts`) and updating the middleware to call it. The
rationale given was consistency with future routes. Only one route existed at
the time. The proposed utility:

```ts
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}
```

## 2026-03-27 15:14 scope-change

### Judgment

Narrowed scope to access tokens only, deferring refresh token support.

### Context

Claude was implementing the full token lifecycle including refresh token
rotation.

---

**Result**: completed
````

---

## Episode Lifecycle

Each episode file covers a single task. A new file is created when the
Summarizer detects that the previous task is done, abandoned, or has shifted
significantly. When a new episode begins, the previous file gets a
`**Result**: completed | paused | cancelled | failed` line appended — and is
never modified again.
