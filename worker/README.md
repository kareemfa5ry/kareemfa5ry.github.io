# worker — chat endpoint

The "ask about Kareem" chat endpoint: a Cloudflare Worker that holds the Anthropic API key, checks every request,
and streams Claude's answer. It answers only from the site's `/llms.txt`, so the CV content stays the single source.

## Modules

| File                   | What it owns                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `wrangler.jsonc`       | Worker config: entry, vars, the `CHAT_RATE_LIMIT` binding (10 requests per 60 s)       |
| `tsconfig.json`        | Worker type check (`@cloudflare/workers-types`), run by `npm run worker:test`          |
| `src/index.ts`         | router: `POST /chat`, `OPTIONS /chat`, everything else 404; runs the guards in order   |
| `src/guards.ts`        | origin check and body shape (pure)                                                     |
| `src/turnstile.ts`     | Turnstile siteverify call with the visitor's IP                                        |
| `src/knowledge.ts`     | fetches `${SITE_URL}/llms.txt` through the Cloudflare cache (`cacheTtl` 3600)          |
| `src/prompt.ts`        | the fixed instructions and the byte-stable, cached system prompt                       |
| `src/claude_stream.ts` | the Claude call (`claude-sonnet-5-5`, streaming) turned into SSE; API error -> message |
| `src/sse.ts`           | SSE frame encoding                                                                     |
| `test/*.test.mjs`      | `node --test` unit checks for guards, prompt, SSE and the error mapping                |

`scripts/check_layout.mjs` scans `worker/` (400-line cap, 8 loose files per folder, no grab-bag names), and
`eslint .` applies the same caps here as in `src/`.

## Contract

`POST /chat` with JSON:

```json
{ "messages": [{ "role": "user", "content": "What does Kareem do?" }], "turnstileToken": "<widget token>" }
```

Guards, in order, each a JSON `{"error": "<short message>"}`:

1. `Origin` must equal `ALLOWED_ORIGIN` (or `DEV_ORIGIN` when that var is set): else **403**.
2. Body: at most 8 messages, each a non-empty string of at most 1000 characters, roles alternate starting with the
   user, the last one from the user, a `turnstileToken` string: else **400**.
3. Turnstile siteverify with `CF-Connecting-IP`: else **403**.
4. Rate limit, 10 requests per minute per IP: else **429**.

If `/llms.txt` cannot be fetched: **503**. Otherwise **200** `text/event-stream`:

```
data: {"text": "Kareem is a "}
data: {"text": "senior data analyst..."}
data: {"done": true}
```

The stream ends with `data: {"done": true}` or `data: {"error": "<short user-facing reason>"}` (refusal, busy,
unavailable). On `error`, discard the text received so far. `OPTIONS /chat` from an allowed origin is the CORS
preflight (204).

## Secrets and vars

| Name                   | Kind   | Value                                                      |
| ---------------------- | ------ | ---------------------------------------------------------- |
| `ANTHROPIC_API_KEY`    | secret | Anthropic API key                                          |
| `TURNSTILE_SECRET_KEY` | secret | secret key of the Turnstile widget for the site            |
| `ALLOWED_ORIGIN`       | var    | `https://kareemfa5ry.github.io` (in `wrangler.jsonc`)      |
| `SITE_URL`             | var    | `https://kareemfa5ry.github.io`, where `/llms.txt` is read |
| `DEV_ORIGIN`           | var    | local only, `http://localhost:4321`; never set it in prod  |

Set the secrets once per account, from the repo root:

```
npx wrangler secret put ANTHROPIC_API_KEY --config worker/wrangler.jsonc
npx wrangler secret put TURNSTILE_SECRET_KEY --config worker/wrangler.jsonc
```

Never commit a key. Local values go in `worker/.dev.vars` (git-ignored), for example:

```
ANTHROPIC_API_KEY=sk-ant-...
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
DEV_ORIGIN=http://localhost:4321
```

`1x...AA` is Cloudflare's always-pass test secret, `2x...AA` the always-fail one.

## Run, test, deploy

```
npm run worker:dev       # wrangler dev at http://localhost:8787 (rate limit simulated locally)
npm run worker:test      # tsc on the Worker, then node --test on worker/test (part of npm run check)
npm run worker:deploy    # wrangler deploy; needs `wrangler login` and the secrets above
```

## Cost controls

- **Anthropic spend limit:** set a monthly limit for the key's workspace in the Claude Console; it is the hard cap.
- **Rate limit:** 10 requests per minute per IP per Cloudflare location (`CHAT_RATE_LIMIT`), after Turnstile.
- **`max_tokens` 600** and effort `low` per answer, at most 8 short messages per request, and the system prompt is
  cached (`cache_control: ephemeral`), so repeat questions read the knowledge at the cache-read price.
