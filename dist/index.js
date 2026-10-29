"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:readline/promises");
const API_URL = 'https://macmini.tailec0045.ts.net/api/chat';
const MODEL = process.env.AI_COMMIT_MODEL ?? 'qwen2.5-coder:14b';
const NOTE_PROMPT = `You describe one file's change from a git diff.

Write one short line saying what changed in this file.
- Start with an imperative verb: "Add", "Fix", "Remove", "Rename".
- Describe only what the diff shows. Do not guess at reasons.
- Lines starting with "-" were removed and lines starting with "+" were added. Compare them.
- If only comments or whitespace changed, say so, such as "Remove inline comments".
- If you cannot tell what the change does, describe it plainly, such as "Clean up the file".

Output only the line. No quotes, no preamble.`;
const COMMIT_PROMPT = `You write a one-line git commit message from notes about a staged change.
Each note says what changed in one file, in the form "file: change".

First, work out the purpose of the change as a whole.
Changes across several files often serve one goal, such as a feature or a fix.

Format:
- Exactly one line, at most 120 characters.
- If the notes serve one goal, describe that goal in one clause.
- If there are several unrelated main changes, write one clause for each, joined with "; ".
- Cover the main changes. Small side changes may be included if they fit.

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
ios/MapView.swift: Add native MapView for displaying maps
ios/MapViewManager.m: Add React Native view manager for MapView
ios/App.xcodeproj/project.pbxproj: Add references for MapView files
src/components/Map/index.tsx: Add Map component wrapping the native view
src/screens/Home/index.tsx: Show the map on the Home screen
Message: Show a native map on the Home screen

Notes:
store/cart.ts: Add cart store with items and isSaving state
components/Product.tsx: Add AddToCart button that is disabled while saving
Message: Add cart button that is disabled while the cart is saving

Notes:
api.ts: Raise request timeout from 5 to 30 seconds
README.md: Fix typo in installation steps
Message: Raise API request timeout to 30 seconds; fix typo in README

Notes:
upload.ts: Retry failed uploads up to three times
build.sh: Remove inline comments
.vscode/settings.json: Change editor tab size
Message: Retry failed uploads; remove inline comments from build.sh

Output only the commit message line. No quotes, no preamble.`;
function git(args) {
    return (0, node_child_process_1.execFileSync)('git', args, {
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024,
    });
}
function getDiff(file) {
    if (file)
        return (0, node_fs_1.readFileSync)(file, 'utf8');
    const diff = git(['diff', '--staged']);
    if (diff === '') {
        console.error('Nothing staged. Run git add first.');
        process.exit(1);
    }
    return diff;
}
function splitDiff(diff) {
    return diff
        .split(/^(?=diff --git )/m)
        .filter((part) => part.trim() !== '');
}
function getFileName(fileDiff) {
    const match = fileDiff.match(/^diff --git a\/(.+) b\//);
    return match ? match[1] : 'unknown file';
}
function getApiKey() {
    return (0, node_child_process_1.execFileSync)('security', ['find-generic-password', '-s', 'ollama-proxy', '-w'], { encoding: 'utf8' }).trim();
}
async function chat(apiKey, system, user) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
        },
        body: JSON.stringify({
            model: MODEL,
            stream: false,
            options: { temperature: 0.2, num_ctx: 16384 },
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
        }),
        signal: AbortSignal.timeout(180_000),
    });
    if (!res.ok)
        throw new Error(`Model request failed: ${res.status} ${res.statusText}`);
    const data = (await res.json());
    const content = data.message?.content?.trim();
    if (!content)
        throw new Error('The model returned an empty message.');
    return content;
}
async function ask(question) {
    const rl = (0, promises_1.createInterface)({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(question);
    rl.close();
    return answer.trim().toLowerCase();
}
function commit(message, edit) {
    const args = edit
        ? ['commit', '-v', '-e', '-m', message]
        : ['commit', '-m', message];
    (0, node_child_process_1.execFileSync)('git', args, { stdio: 'inherit' });
}
async function main() {
    const file = process.argv[2];
    const diff = getDiff(file);
    const fileDiffs = splitDiff(diff);
    const apiKey = getApiKey();
    const notes = [];
    for (const fileDiff of fileDiffs) {
        const note = await chat(apiKey, NOTE_PROMPT, fileDiff.slice(0, 20000));
        notes.push(`${getFileName(fileDiff)}: ${note}`);
    }
    // console.error(notes.join('\n'))
    const raw = await chat(apiKey, COMMIT_PROMPT, notes.join('\n'));
    const message = raw.split('\n')[0].trim().replace(/\.$/, '');
    console.log(message);
    // Test mode: print the message only
    if (file)
        return;
    console.log();
    const answer = await ask('Use this message? (y/n/e) ');
    if (answer === 'y') {
        commit(message, false);
    }
    else if (answer === 'e') {
        commit(message, true);
    }
    else {
        console.log('Cancelled. Your changes are still staged.');
    }
}
main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
