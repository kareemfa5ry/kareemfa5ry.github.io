#!/bin/sh
# Scaffold public/demos/<slug>/index.html from its spec.json. Thin wrapper; the work is in new_demo.mjs
# (on Windows run: node .claude/skills/project-demo/scripts/new_demo.mjs <slug>).
exec node "$(dirname "$0")/new_demo.mjs" "$@"
