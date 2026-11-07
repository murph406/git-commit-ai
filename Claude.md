# Git AI Commit

AI workflow that writes git commit messages from your staged changes, using a local LLM. This is intended for personal use. I am learning ai development fundamentals through this project.

Stack: TypeScript, Node, Shell

  
## Layout

- `src/` — app code
  - `index.ts` — entry point: staged diffs → generated message → confirm (y/n/e) → commit
  - `cli/` — terminal prompt for user input
  - `git/` — runs `git commit`, with optional editor
  - `llm/` — model setup, API key from macOS Keychain, `generateText` wrapper, and `generateMessage` (one note per file, then one commit line from the notes)
  - `prompts/` — system prompts: `NOTE_PROMPT` (per-file) and `COMMIT_PROMPT` (final message)
  - `tools/` — read staged git state: `listStagedFiles`, `getFileDiff` (truncates large diffs)
- `evals/` — evals
  - `run.ts`, `run.sh` — eval runner and its shell script
  - `cases/` — paired `.diff` inputs and `.expected` messages
  - `results/` — timestamped JSON output from runs


## How to work in this repo

**Stay scoped.**
- Work only from files I name or `@`-mention.
- Never read: `node_modules/`, `build/`, `dist/`, `.git/`, `evals/results/`, lockfiles (`package-lock.json`, `yarn.lock`), or generated code.
- Prefer a targeted search over opening a whole file, and read only the relevant part of large files.
- If a request is vague, ask one clarifying question instead of exploring the codebase to guess.

**Keep responses short.**
- Answer directly; skip preamble and recaps.
- When an answer involves an AI/LLM concept (prompting, evals, context, truncation), explain the concept in a sentence or two. I'm learning.
- Don't repeat code I already gave you. Show only the lines that change, with enough context to place them.
- Explain only what isn't obvious.

**Environment limits.**
- You can read files but cannot run commands or edit files. When something needs running, give me the exact command and a one-line explanation of what it does.
- Don't suggest destructive commands (deleting files, force-pushing, resetting history) unless I ask, and flag them clearly when you do.

**Privacy.**
- If you come across anything that looks like a secret (API key, token, password, private key, customer data), don't repeat it. Tell me the file and line so I can remove it.

## Conventions

- TypeScript strict mode; avoid `any`.
- One responsibility per folder: only `git/` and `tools/` call git, only `llm/` calls the model.
- `tools/` is read-only: it inspects staged state and never modifies the repo.
- Prompts live in `prompts/` as exported constants, never inline in other code.
- The API key is read only through the Keychain helper in `llm/`; never log it or hardcode it.
- Eval cases are named in pairs: `<name>.diff` and `<name>.expected`.
- After changing a prompt, run `npm run eval` and compare against the previous result.

## Commands (for me to run)

- Install: `npm install`
- Run: `npm start` — generate a message from staged changes (needs `.env`)
- Build: `npm run build` — bundle to `dist/index.js`
- Typecheck: `npm run typecheck`
- Lint: `npm run lint` (autofix: `npm run lint:fix`)
- Eval: `npm run eval` — run `evals/cases`, write to `evals/results` (needs `.env`)