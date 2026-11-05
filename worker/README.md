# worker — chat endpoint

The "ask about Kareem" chat endpoint: a Cloudflare Worker that holds the Anthropic API key, checks every request,
and streams Claude's answer. It answers only from the site's `/llms.txt`, so the CV content stays the single source.

## Modules

| File                    | What it owns                                                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `wrangler.jsonc`        | Worker config: entry, vars, `CHAT_RATE_LIMIT` (10 per 60 s), `GLOBAL_LIMIT` (60 per 60 s)                                                 |
| `tsconfig.json`         | Worker type check (`@cloudflare/workers-types`), run by `npm run worker:test`                                                             |
| `src/index.ts`          | router: `POST /chat`, `OPTIONS /chat`, everything else 404; runs the guards in order                                                      |
| `src/http_responses.ts` | JSON errors, CORS headers, the preflight answer, SSE headers                                                                              |
| `src/guards.ts`         | origin, body size, body shape, rate-limit key (IPv4 address, IPv6 /64) (pure)                                                             |
| `src/turnstile.ts`      | Turnstile siteverify with the visitor's IP; the token's hostname must be the site's                                                       |
| `src/knowledge.ts`      | `${SITE_URL}/llms.txt` via the Cloudflare cache: 2xx for 3600 s, 3xx-5xx never cached; must be `text/plain` under 64 KB                   |
| `src/prompt.ts`         | the fixed instructions and the byte-stable, cached system prompt                                                                          |
| `src/claude_stream.ts`  | the Claude call (`claude-sonnet-5-5`, streaming) as SSE; closing frame; API error -> message                                              |
| `src/sse.ts`            | SSE frame encoding                                                                                                                        |
| `test/*.test.mjs`       | `node --test`: guards, prompt, SSE, closing frame and errors; `index.test.mjs` drives the router with fake bindings and a stubbed `fetch` |

`scripts/check_layout.mjs` scans `worker/` (400-line cap, 8 loose files per folder, no grab-bag names), and
`eslint .` applies the same caps here as in `src/`.

## Contract

`POST /chat` with JSON:

```json
{ "messages": [{ "role": "user", "content": "What does Kareem do?" }], "turnstileToken": "<widget token>" }
```

Guards, in order, each a JSON `{"error": "<short message>"}`:

1. `Origin` must equal `ALLOWED_ORIGIN` (or `DEV_ORIGIN` when that var is set): else **403**.
2. `Content-Length` present and at most 32 KB (32768 bytes), checked before the body is read: else **413**.
3. Body: at most 8 messages, each a non-empty string of at most 1000 characters, at most 4000 characters in total,
   roles alternate starting with the user, the last one from the user, a `turnstileToken` string: else **400**.
4. Turnstile siteverify with `CF-Connecting-IP`; the token's `hostname` must be the host of `ALLOWED_ORIGIN`: else
   **403**.
5. Rate limits: 10 requests per minute per visitor (IPv4 address, or IPv6 /64 prefix), then 60 per minute across
   all visitors (key `global`): else **429** with the same message.

If `/llms.txt` cannot be fetched, is not `text/plain`, or is 64 KB or more: **503**. Otherwise **200** `text/event-stream`:

```
data: {"text": "Kareem is a "}
data: {"text": "senior data analyst..."}
data: {"done": true}
```

The stream ends with `data: {"done": true}` or `data: {"error": "<short user-facing reason>"}`: a refusal, an
answer cut off at `max_tokens` ("The answer was cut short. Ask a narrower question."), busy, or unavailable. A visitor
who closes the page aborts the Claude call, and that abort is not logged as a failure. On `error`, discard the text received so far. `OPTIONS /chat` from an allowed origin is the CORS
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

`1x...AA` is Cloudflare's always-pass test secret, `2x...AA` the always-fail one. Test secrets report the
hostname `example.com`, so with them the hostname check fails unless `.dev.vars` also sets
`ALLOWED_ORIGIN=https://example.com` (and requests send that `Origin`).

## Run, test, deploy

```
npm run worker:dev       # wrangler dev at http://localhost:8787 (rate limit simulated locally)
npm run worker:test      # tsc on the Worker, then node --test on worker/test (part of npm run check)
npm run worker:deploy    # wrangler deploy; needs `wrangler login` and the secrets above
```

## Cost controls

- **Anthropic spend limit:** set a monthly limit for the key's workspace in the Claude Console; it is the hard cap.
- **Rate limits:** 10 requests per minute per visitor (`CHAT_RATE_LIMIT`) and 60 per minute in total
  (`GLOBAL_LIMIT`), both after Turnstile; Cloudflare counts them per location, so the ceiling is per data centre.
- **Request size:** 32 KB body, 4000 characters of conversation.
- **`max_tokens` 600** and effort `low` per answer, and the system prompt is
  cached (`cache_control: ephemeral`), so repeat questions read the knowledge at the cache-read price.
