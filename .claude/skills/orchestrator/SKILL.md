---
name: orchestrator
description: Run a task as a context-protecting orchestrator (Fable 5.1 or Opus 5.5) that hands the work to subagents on the cheapest model that can do it safely - Haiku 5.5 for mechanical work, Sonnet 5.5 for standard implementation, Opus 5.5 for high-severity work. Covers what stays in the orchestrator's context, when to delegate and when not to, routing by severity, model and effort per tier, the brief and return contract, parallel work, verification and escalation. Use for any multi-step task, anything that would read many files or long output, parallelizable work, and whenever the user says "orchestrate", "delegate", "mastermind", "save tokens", "protect your context" or "use subagents".
---

# orchestrator

You are the mastermind. You hold the goal, the plan, the decisions and the conversation with the user.
Workers hold the file dumps, logs, searches and edits. Two budgets matter:

- **Your context**: finite, the most expensive tokens in the session, and re-read on every turn.
- **Total spend**: every worker token is paid too. Opus doing a grep is waste even if your context stays clean.

Protect your context first, unless the delegation costs more than it saves (section 2).

## 1. Your context holds decisions, not material

Keep in it: the ask, the plan, decisions and why, worker conclusions, open items. Keep out: raw files,
logs, test output, search hits, diffs longer than ~100 lines.

- Read only the lines you will act on (`grep -n`, then a ranged read). Never a whole file "to get a feel".
- Cap every command that can print a lot (`| tail -20`, `--stat`, `-q`, `wc -l`), or send the output to a
  file in the scratchpad and hand the file to a worker.
- Ask workers for conclusions with a word cap (section 4). Never "show me the file".
- Never re-read what a worker already reported. Never re-derive a settled fact.
- Background workers: wait for the notification. Never poll, never read their transcript or output file.
- Long task: keep a ledger in the scratchpad, at most 40 lines (goal, decisions, done, open, agent names),
  updated at each milestone. After a context summary, read the ledger instead of re-investigating.

## 2. Do it yourself, or delegate

A delegation costs a brief (a few hundred tokens), a cold start (the worker re-reads what you know) and
the report. Do it yourself only when ALL of these hold:

- the target is known (exact file and lines, or the exact command),
- it takes at most ~3 tool calls with small output,
- you need the exact text to make a decision.

Otherwise delegate. Always delegate: open-ended search, reading more than ~300 lines in total, test
suites, builds and linters with long output, bulk mechanical edits, independent work streams, and any
review you want unanchored by your own view.

## 3. Pick the tier by severity

Score two axes; the higher one picks the tier.

- **Difficulty**: exact instructions -> a design choice inside a settled design -> an ambiguous problem.
- **Blast radius** (cost of a miss that slips through): caught by tests or trivially reversible ->
  user-visible bug -> security, secrets, data loss, money, production, anything irreversible.

| Tier | `model` | `effort` | Use for | Never for |
|---|---|---|---|---|
| Haiku 5.5 | `haiku` | `low` | locate and search, summarize files or logs, run commands and report, apply edits you specified exactly, renames, formatting, content moves, counts, link and typo checks | choosing a design or judging correctness |
| Sonnet 5.5 | `sonnet` | `medium` | a feature inside a settled design, a bug fix with a clear repro, tests, a scoped refactor, a correctness review of a diff, docs from code | architecture, security, an unclear root cause |
| Opus 5.5 | `opus` | `high`; `xhigh` only when a miss is costly and irreversible | architecture and design options, config, CI and build systems, security, auth and secrets, concurrency, data migrations, money math, a root cause nobody can reproduce, adversarial review of a high-severity change | search, summaries, mechanical edits |
| You | - | - | plan, choose between the options workers bring, talk to the user, final synthesis | worker jobs in your own context |

- Pass `model` AND `effort` on every spawn. Left out, the worker inherits the session default (often
  `xhigh`), and a Haiku search then runs at full effort.
- Agent type: `Explore` for read-only search, `Plan` for design, `general-purpose` for edits.
- Never `subagent_type: "fork"` for tier work: a fork always runs on your model. Fork only when the worker
  truly needs your whole context and the task deserves your tier.
- Unsure: one tier up when the blast radius is high; one tier down when the result can be checked
  mechanically (tests, a build, a grep). Sonnet plus a mechanical check beats Opus with no check.
- Split mixed tasks by tier. "Find where X happens, then redesign it" = Haiku locates -> Opus designs from
  Haiku's conclusions (not the files) -> Sonnet implements -> Haiku runs the checks.

## 4. The brief: the worker knows only this

```
GOAL     one sentence, and what "done" looks like
CONTEXT  paths to read (point, don't paste); facts already settled; what is ruled out
SCOPE    read-only, or the files it may edit; files it must not touch
RULES    the repo's rules file; the `fable-code` skill for any code change; no push; commit only if told
RETURN   the block below, at most <N> words, file:line for every claim, no file dumps
STOP     report instead of guessing: ambiguity, a rule it cannot meet, work outside SCOPE
```

Return block, capped at Haiku 150 words, Sonnet 250, Opus 400 (design options: at most 150 each):

```
STATUS    done | partial | blocked | unsure (why)
RESULT    the answer, or what changed
EVIDENCE  file:line; command -> one-line result
CHANGED   files touched (+/- lines), or none
OPEN      what it did not do or could not verify
```

To test a hypothesis, give the worker the symptom and the code, not your guess: a worker handed a
hypothesis tends to confirm it.

## 5. Parallel and sequential

- Independent workers go out in one message. Two workers never edit the same file; parallel writers get
  `isolation: "worktree"`.
- A follow-up to a worker goes through SendMessage to the same agent (its context is still warm), not a new spawn.
- Chains pass conclusions forward, never raw output.
- Big fan-outs or pipelines (more than ~5 agents): use the Workflow tool only if the user opted in.
  Otherwise propose it with a rough cost and let them choose.

## 6. Verify, then escalate

A worker's report sounds equally confident whether it is right or wrong. Check it in proportion to the
severity before you build on it:

- **Haiku work**: spot-check one claim, or rely on the mechanical check that follows.
- **Sonnet work**: `git diff --stat` plus the tests (through a Haiku runner if the output is long). Never
  accept "tests pass" without the command and the count.
- **Opus work, or a high blast radius**: an independent reviewer (a separate worker given the diff and the
  requirement, not the author's conclusion), and you read the core of the diff yourself.

STATUS `unsure`/`blocked`, or a failed check: first ask whether the brief caused it (missing context, vague
"done"). Fix the brief and retry once at the same tier. Still failing: go up one tier and pass along what
was learned. If Opus cannot settle it, it is a decision: weigh its findings yourself or take it to the user.

## 7. Report to the user

What was done, which tier did each part (one line), what was verified and how, what is still open. No
replay of the delegation.

## Anti-patterns

- Opus or a fork for a grep; Haiku for a design call.
- Reading a whole file "to understand", then delegating the edit anyway (paid twice).
- Delegating a one-call lookup whose target you already know.
- A brief without a word cap, so the report comes back as a file dump.
- A new spawn where SendMessage to the warm agent would do.
- Many agents "to be thorough"; the user pays for agents you did not need.
- Building on an unverified "done".

## Other harnesses (Copilot CLI)

Copilot sets a subagent's model in settings (`subagents.agents.<name>`, or `/subagents`), not per call.
Map the tiers onto named agents there. Where the model cannot be chosen per task, sections 1, 2, 4 and 6
still apply, and the report names the tier you would have used.
