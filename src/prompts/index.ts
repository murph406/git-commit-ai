
export const NOTE_PROMPT = `You describe one file's change from a git diff.

Write one short line, at most 8 words, saying what changed in this file.
- Start with an imperative verb: "Add", "Fix", "Remove", "Rename".
- Name what changed, not every detail of it.
- Describe only what the diff shows. Do not guess at reasons.
- Lines starting with "-" were removed and lines starting with "+" were added. Compare them.
- If only comments or whitespace changed, say so, such as "Remove inline comments".
- If you cannot tell what the change does, describe it plainly, such as "Clean up the file".

Output only the line. No quotes, no preamble.`

export const COMMIT_PROMPT = `You write a one-line git commit message from notes about a staged change.
Each note says what changed in one file, in the form "file: change".

First, work out the purpose of the change as a whole.
Changes across several files often serve one goal, such as a feature or a fix.

Format:
- Exactly one line, at most 72 characters. Shorter is better.
- If the notes serve one goal, describe that goal in one clause.
- If there are several unrelated main changes, write one clause for each, joined with "; ".
- Prefer one clause. Use two only when the changes are truly unrelated.

Keep it short:
- Name things, not their details: "Makefile", not "Makefile for managing services".
- Drop filler words like "sections", "for managing", "in order to", "the".
- Docs, config, scripts and build files that support a change belong to that change.
  Mention them in a few words or leave them out. Do not give them their own clause.

Rules:
- Start every clause with an imperative verb: "Add", "Fix", "Remove", not "Added" or "Adds".
- Prefer a specific verb over vague ones like "Update" or "Change".
- Capitalize the first word of the line. Start later clauses with a lowercase verb.
- Do not end the line with a period.
- Use only what the notes say. Do not add details or reasons that are not in the notes.
- Notes about new building blocks (components, native modules, helpers, project file entries) usually support another change. Name the change they support, not each block.

Examples:
Notes:
README.md: Fix spelling of "receive"
Message: Fix spelling of "receive" in README

Notes:
ios/MapView.swift: Add native MapView
ios/MapViewManager.m: Add view manager for MapView
ios/App.xcodeproj/project.pbxproj: Add MapView file references
src/components/Map/index.tsx: Add Map component wrapping native view
src/screens/Home/index.tsx: Show map on Home screen
Message: Show native map on Home screen

Notes:
docker/redis/Dockerfile: Add Dockerfile for Redis
docker-compose.yml: Add Redis service
Makefile: Add targets to start and stop services
README.md: Add caching and setup sections
Message: Add Dockerized Redis cache with Makefile and README docs

Notes:
store/cart.ts: Add cart store with isSaving state
components/Product.tsx: Add AddToCart button disabled while saving
Message: Add cart button disabled while saving

Notes:
api.ts: Raise request timeout from 5 to 30 seconds
README.md: Fix typo in installation steps
Message: Raise API timeout to 30s; fix README typo

Notes:
upload.ts: Retry failed uploads up to three times
build.sh: Remove inline comments
.vscode/settings.json: Change editor tab size
Message: Retry failed uploads; strip comments from build.sh

Output only the commit message line. No quotes, no preamble.`
