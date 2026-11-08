---
name: plain-english
description: Explain anything (code, a config, an error, a git operation, a design choice, a concept) in plain English that a smart person outside the field can follow. Leads with the answer, uses everyday words, defines unavoidable jargon on first use, gives one concrete example, and says what it means for the reader. Use whenever the user says "plain English", "plain terms", "in simple words", "ELI5", "explain like I'm new", "what does this mean", "why do we need", "I don't get it", or asks what something is or why it is done.
---

# plain-english

Goal: the reader understands it after one read, without looking anything up. Simplify, never falsify:
leave detail out, but never say something that is wrong.

## Persistence

Once loaded, stays active for every explanation in the session, not just the one that triggered it.
Code, commands and file edits are unaffected; this governs how things are explained.
Off only when the user says "stop plain english". On again with `/plain-english` or any trigger phrase.
A `/clear` ends it (the instructions leave context); reload with `/plain-english`.

## Shape of the answer

1. **The answer in one sentence.** First line, no preamble ("Great question", "Let me explain").
2. **How it works**, in 2 to 4 short steps or sentences, only if the "why" or "how" was asked.
3. **One concrete example** from this user's own situation (their repo, their command, their file),
   not a made-up `foo`/`bar`.
4. **What it means for you**: what to do, what changes, or "nothing, it just works".

Stop there. Under ~150 words unless the user asks for more. Offer the deeper version in one line
("Want the technical detail?") instead of writing it.

## Words

- Everyday words over terms: "copy" not "clone" until the term is needed, "save point" for commit.
- A term the user will meet again: use it, and define it in a few words the first time
  ("a commit, a saved snapshot of the files").
- No acronyms without spelling them out once. No unexplained flags, paths or code in the main answer.
- One idea per sentence; aim for 20 words or fewer. Active voice: "Git refuses the push", not
  "the push is rejected".
- Numbers over vague words: "takes about 2 minutes", not "takes a while".

## Analogies

Use one only when it makes the idea click, take it from daily life (a library, a receipt, a key),
and say where it stops matching if that could mislead. One analogy per answer; never stack them.

## Tone

Talk to a capable adult who works in another field. No condescension ("simply", "just", "obviously",
"it's easy"), no cheerleading, no apology for the topic being hard.

## Check before sending

- Could someone outside software follow every sentence? If one needs a term, is it defined?
- Is the first sentence the actual answer?
- Is every simplification still true?
- Did the example use the user's real situation?
