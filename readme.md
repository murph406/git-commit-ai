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

## Usage

```sh
git add <files>
git ai-commit
```

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

## Configuration

Settings are read from a `.env` file in the project root. Copy `.env.example` to `.env` and fill it in:

```sh
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `BASE_API_URL` | none (required) | Proxy URL for Ollama's OpenAI-compatible endpoint, e.g. `https://your-host/v1` |
| `AI_MODEL` | none (required) | Model for the notes and the final message |
| `DIFF_CHARACTER_LIMIT` | `12000` | Maximum characters of each file's diff sent to the model |

The `.env` file is loaded with Node's `--env-file` flag (in `npm start` and in the `~/bin` script), so changes apply on the next run without rebuilding. Variables set in your shell override the file.