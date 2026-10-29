# git ai-commit

A git command that writes commit messages for your staged changes using a self-hosted model, then lets you review, edit, or cancel before anything is committed.

```
$ git ai-commit
index.yaml: Add metadata to FrontendS3BucketLogs resource
scripts/parameter-overrides/print.sh: Remove inline comments
Add metadata to FrontendS3BucketLogs resource; remove inline comments from print.sh

Use this message? (y/n/e)
```

## How it works

1. Reads `git diff --staged` and splits it into one diff per file.
2. Asks the model to describe each file's change in one short note.
3. Asks the model to turn the notes into a one-line commit message.
4. Shows the message and asks:
   - `y` commits with the message
   - `e` opens your editor with the message and the full diff below it
   - `n` cancels and leaves your changes staged

Describing each file separately keeps every call small and focused. In a single call, the model misread deleted comments as behavior changes and summarized only the first files of large diffs.

## Setup

The model runs on [Ollama](https://ollama.com) behind an authenticating proxy ([ollama-auth-proxy](https://github.com/)). Requires Node 18 or newer and macOS (the API key is read from the Keychain).

1. Store the proxy API key in the Keychain:

   ```sh
   security add-generic-password -a "$USER" -s ollama-proxy -w
   ```

2. Set your proxy URL in `API_URL` in `src/index.ts`, then build:

   ```sh
   npm install
   npm run build
   ```

3. Create an executable `~/bin/git-ai-commit` (with `~/bin` on your `PATH`):

   ```bash
   #!/bin/bash
   exec node "$HOME/path/to/git-ai-commit/dist/index.js" "$@"
   ```

4. Optional: set an editor for `e`, for example VS Code:

   ```sh
   git config --global core.editor "code --wait"
   ```

## Usage

```sh
git add <files>
git ai-commit
```

Test mode prints a message for a saved diff file without asking or committing:

```sh
git ai-commit path/to/change.diff
```

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `AI_COMMIT_NOTE_MODEL` | `qwen2.5-coder:14b` | Model for the per-file notes |
| `AI_COMMIT_FINAL_MODEL` | `qwen2.5-coder:14b` | Model for the final message |

## Message format

- One line, at most 120 characters
- Imperative mood ("Add", "Fix", "Remove")
- Several unrelated changes are joined with `; `
- No trailing period (also enforced in code)

## Evaluation

Prompt and model changes are checked against a small set of saved diffs, each with a reference message (`.diff` and `.expected` files). A runner script prints every result next to its reference so changes can be compared on the same inputs instead of judged from single runs.

## What I learned

- Check the input before blaming the model: a stray staged file looked like a hallucination.
- Ollama's default context window is small, and long requests silently drop the system prompt. Setting `num_ctx` fixed it.
- More prompt rules stopped helping at some point. Splitting the task into smaller calls fixed what rules could not.
- Rules that code can check (trailing period, one line) belong in code, not only in the prompt.
- Evals turn "it looked better" into evidence.

## Legacy

`legacy/git-ai-commit.sh` is the original single-call bash version.