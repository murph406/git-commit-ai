# git ai-commit

A git command that writes commit messages for your staged changes using a self-hosted model, then lets you review, edit, or cancel before anything is committed.

```
$ git ai-commit
Add metadata to FrontendS3BucketLogs resource; remove inline comments from print.sh

Use this message? (y/n/e)
```

## How it works

It's a fixed workflow, not an agent: the code decides every step, and the model only does small, focused writing tasks.

1. Lists the staged files with `git diff --staged --name-status`.
2. Gets each file's diff. Renamed files are diffed against their old path, so they show up as renames.
3. Asks the model to describe each file's change in one short note.
4. Asks the model to turn the notes into a one-line commit message.
5. Shows the message and asks:
   - `y` commits with the message
   - `e` opens your editor with the message and the full diff below it
   - `n` cancels and leaves your changes staged

Describing each file separately keeps every call small and focused. In a single call, the model misread deleted comments as behavior changes and summarized only the first files of large diffs.

Each file's diff is capped at 12,000 characters to fit the model's context window. When a diff is cut off, the model is told so it doesn't describe a partial change as the whole thing.

## Setup

The model runs on [Ollama](https://ollama.com) behind an authenticating proxy ([ollama-auth-proxy](https://github.com/)). The proxy must forward Ollama's OpenAI-compatible `/v1` endpoint. Requires Node 20 or newer and macOS (the API key is read from the Keychain).

1. Store the proxy API key in the Keychain:

   ```sh
   security add-generic-password -a "$USER" -s ollama-proxy -w
   ```

2. Set your proxy URL in `BASE_URL` in `src/llm/model.ts`, then build:

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

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `AI_COMMIT_MODEL` | `qwen2.5-coder:14b` | Model for the notes and the final message |

## Message format

- One line, at most 72 characters (asked for in the prompt)
- Imperative mood ("Add", "Fix", "Remove")
- Several unrelated changes are joined with `; `
- First line only and no trailing period (enforced in code)

## Project structure

```
index.ts              wires the steps together
src/
  tools/
    listStagedFiles/  staged files and their status
    getFileDiff/      one file's staged diff, capped in size
  llm/                API key, model setup, chat calls
  git/                commit
  cli/                terminal prompts
  prompts.ts          note and commit prompts
```

The functions in `tools/` are plain functions called by the workflow. They're also wrapped with the AI SDK's `tool()` in `src/tools.ts` for experimenting with an agent version.

## Development

```sh
npm start            # run without building
npm run typecheck    # check types
npm run lint         # lint (npm run lint:fix to fix)
```

## Evaluation

Prompt and model changes are checked against a small set of saved diffs, each with a reference message (`.diff` and `.expected` files). A runner script prints every result next to its reference so changes can be compared on the same inputs instead of judged from single runs.

## What I learned

- Check the input before blaming the model: a stray staged file looked like a hallucination.
- Ollama's default context window is small (4,096 tokens), and long requests are trimmed silently. The OpenAI-compatible endpoint ignores `num_ctx`, so diffs are capped in code to fit.
- More prompt rules stopped helping at some point. Splitting the task into smaller calls fixed what rules could not.
- Rules that code can check (trailing period, one line) belong in code, not only in the prompt.
- Evals turn "it looked better" into evidence.
- Pick the design to fit the model. As an agent, the 14B model wrote tool calls as plain text instead of real tool calls. As a fixed workflow with small, focused calls, it works well.

## Legacy

`legacy/git-ai-commit.sh` is the original single-call bash version.