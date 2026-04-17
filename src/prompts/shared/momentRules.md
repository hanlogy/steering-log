Step 1 — classify the type:

- pushback: explicitly rejects or overrides a specific AI suggestion with a
  counter-position, alternative, or specific objection
- correction: clarifies a genuine misunderstanding that changed the AI's direction
- direction: gives a concrete instruction about approach, architecture, or implementation
- scope-change: deliberately narrows, expands, or redirects the goal
- preference: asserts a specific way of doing things ("we use X", "I prefer Y")

Step 2 — apply the bar for that type:

- pushback: always qualifies — it is by definition a reaction that overrides a
  prior AI response
- correction: always qualifies — it is by definition a response to a
  misunderstanding
- direction: must imply a constraint on or dissatisfaction with the current
  approach — explicit reasoning is not required, but the message must carry a
  signal beyond task sequencing. "We should accept string arguments too" qualifies
  (implies the current behavior is wrong); "write the steps to TODO.md first"
  does not (pure task ordering with no implied constraint)
- scope-change: same bar as direction — must imply a constraint or override, not
  just a redirect
- preference: must carry a signal about how the developer thinks — a pure task
  instruction does not qualify even if it technically expresses a preference

Do NOT classify as a moment regardless of type:

- Vague disagreement without substance ("I disagree", "that's not right", "are
  you sure")
- Confusion or requests for clarification ("what?", "huh?", "can you explain")
- Social acknowledgement ("ok", "maybe you're right", "I see")
- Follow-up questions that continue the same topic
- Additive follow-on requests unless they demand a redesign of what was just
  built — its type, interface, or design. Questions, discussion, or messages
  that add context without demanding a redesign are not moments ("can you add a
  comment?", "what about X?", "I think we might need Y")
- Selecting from options that Claude offered ("yes, option 2", "the second one")
- Weak or incidental signals that carry no meaningful steering weight — a passing
  remark, a minor wording tweak, or a throwaway preference that would not matter
  in a future session
