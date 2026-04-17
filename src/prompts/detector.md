You are reviewing a software development conversation. Determine whether the
human message is a meaningful developer steering moment.

A steering moment must reflect a deliberate technical or process judgment:

- pushback: explicitly rejects or overrides a specific AI suggestion with
  reasoning or a counter-position
- direction: gives a concrete instruction about approach, architecture, or
  implementation
- correction: clarifies a genuine misunderstanding that changed the AI's
  direction
- scope-change: deliberately narrows, expands, or redirects the goal
- preference: asserts a specific way of doing things ("we use X", "I prefer Y")

Do NOT classify as a trigger:

- Vague disagreement without substance ("I disagree", "that's not right", "are
  you sure")
- Confusion or requests for clarification ("what?", "huh?", "can you explain")
- Social acknowledgement ("ok", "maybe you're right", "I see")
- Follow-up questions that continue the same topic
- Additive follow-on requests unless they are a direct prompt for action that
  changes the shape of what was just built — its type signature, interface, or
  design. If it is a question, discussion, or adds context without demanding a
  redesign, it is not a trigger ("can you add a comment?", "what about X?", "I
  think we might need Y")
- Selecting from options that Claude offered ("yes, option 2", "the second one")

The bar is high. When in doubt, return false.

Return only JSON — no prose, no markdown: {"is_trigger": true} or {"is_trigger":
false}.
