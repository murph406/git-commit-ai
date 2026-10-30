#!/bin/bash
set -eu

for diff in ~/git-ai-commit-evals/cases/*.diff; do
  name=$(basename "$diff" .diff)
  expected="${diff%.diff}.expected"

  echo "== $name"
  echo "expected: $(cat "$expected")"
  echo "got:      $(git ai-commit "$diff")"
  echo
done