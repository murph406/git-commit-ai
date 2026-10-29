#!/bin/bash
set -eu
model="${AI_COMMIT_MODEL:-qwen2.5-coder:14b}"

if [ $# -gt 0 ]; then
  diff=$(head -c 20000 "$1")
  files=$(git apply --stat "$1")
else
  if git diff --staged --quiet; then
    echo "Nothing staged. Run git add first." >&2
    exit 1
  fi
  diff=$(git diff --staged | head -c 20000)
  files=$(git diff --staged --stat)
fi

prompt='You write a one-line git commit message for a staged diff.

First, read the whole diff and work out the purpose of the change.
Changes across several files often serve one goal, such as a feature or a fix.

Format:
- Exactly one line, at most 120 characters.
- If the changes serve one goal, describe that goal in one clause.
- If there are several unrelated main changes, write one clause for each, joined with "; ".
- Cover the main changes. Small side changes may be included if they fit.

Rules:
- Start every clause with an imperative verb: "Add", "Fix", "Remove", not "Added" or "Adds".
- Prefer a specific verb over vague ones like "Update" or "Change".
- Capitalize the first word of the line. Start later clauses with a lowercase verb.
- Do not end the line with a period.
- Describe only what the diff shows. Do not guess at reasons or details that are not in the diff.
- Lines starting with "-" were removed and lines starting with "+" were added. Compare them before describing a change.
- If only comments or whitespace changed, describe it as a comment cleanup. Do not report what a removed comment says as a change in behavior.
- If you cannot tell what a change does, describe it plainly, such as "clean up deploy.sh". Never guess at a behavior change.

Examples:
Change: "Recieve" changed to "Receive" in README.md
Message: Fix spelling of "receive" in README

Change: a cart store added in store/cart.ts, an AddToCart button added in components/Product.tsx, and the button disabled while the cart is saving
Message: Add cart button that is disabled while the cart is saving

Change: a typo fixed in README.md and a timeout raised from 5 to 30 seconds in api.ts
Message: Raise API request timeout to 30 seconds; fix typo in README

Change: inline comments removed from two lines in deploy.sh, code unchanged
Message: Remove inline comments from deploy.sh

Change: a retry added to the upload function in upload.ts, inline comments removed from build.sh, and an editor setting changed in .vscode/settings.json
Message: Retry failed uploads in upload.ts; remove inline comments from build.sh

Output only the commit message line. No quotes, no preamble, no code fences.'

body=$(jq -n \
  --arg model "$model" \
  --arg prompt "$prompt" \
  --arg files "$files" \
  --arg diff "$diff" \
  '{
    model: $model,
    stream: false,
    options: { temperature: 0.2, num_ctx: 16384 },
    messages: [
      { role: "system", content: $prompt },
      { role: "user", content: ("Changed files:\n" + $files + "\n\nDiff:\n" + $diff) }
    ]
  }')

response=$(printf 'x-api-key: %s\n' "$(security find-generic-password -s ollama-proxy -w)" |
  curl -sS --fail --max-time 180 https://macmini.tailec0045.ts.net/api/chat \
    -H @- \
    -H 'content-type: application/json' \
    -d "$body") || {
  echo "Request to the model failed. Is the mini awake and online?" >&2
  exit 1
}

message=$(printf '%s' "$response" | jq -r '.message.content // empty')

if [ -z "$message" ]; then
  echo "The model returned an empty message." >&2
  exit 1
fi
message=${message%.}

if [ $# -gt 0 ]; then
  echo "$message"
  exit 0
fi

echo "$message"
echo

read -r -p "Use this message? (y/n/e) " answer

case "$answer" in
  y|Y)
    git commit -m "$message"
    ;;
  e|E)
    git commit -v -e -m "$message"
    ;;
  *)
    echo "Cancelled. Your changes are still staged."
    ;;
esac