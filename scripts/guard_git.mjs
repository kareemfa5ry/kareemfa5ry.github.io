// Claude Code PreToolUse hook for Bash (wired in .claude/settings.json). Reads the tool input JSON on stdin and
// blocks (exit 2, one-line reason on stderr) a `git commit` that skips hooks or a `git push` that forces.
import { readFileSync } from "node:fs";

const COMMIT = /\bgit\b[^;&|]*\bcommit\b/;
const SKIP_HOOKS = /(^|\s)(--no-verify|-[a-zA-Z]*n[a-zA-Z]*)(\s|$)/;
const PUSH = /\bgit\b[^;&|]*\bpush\b/;
const FORCE = /(^|\s)(--force\S*|-[a-zA-Z]*f[a-zA-Z]*)(\s|$)/;

function blockReason(command) {
  if (COMMIT.test(command) && SKIP_HOOKS.test(command))
    return "git commit must run the pre-commit hook: drop --no-verify / -n";
  if (PUSH.test(command) && FORCE.test(command)) return "git push --force / -f is not allowed in this repo";
  return "";
}

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const reason = blockReason(String(input?.tool_input?.command ?? ""));
if (reason) {
  console.error(`Blocked: ${reason}`);
  process.exit(2);
}
