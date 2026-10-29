import { execFileSync } from "node:child_process";
import { generateText, type LanguageModel } from "ai";
import { createInterface } from "node:readline/promises";
import { getFileDiff, listStagedFiles } from "./src/tools";
import { COMMIT_PROMPT, NOTE_PROMPT } from "./src/prompts";
import { getApiKey } from "./src/llm/apiKey";
import { createModel } from "./src/llm/model";
import { commit } from "./src/git/commit";

async function ask(question: string): Promise<string> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(question);

    rl.close();
    return answer.trim().toLowerCase();
}

type ChatPropTypes = {
    model: LanguageModel,
    system: string,
    prompt: string,
}

async function chat({ model, system, prompt }: ChatPropTypes): Promise<string> {
    const { text } = await generateText({
        model,
        system,
        prompt,
        temperature: 0.2,
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(180_000),
    });

    const content = text.trim();
    if (!content) throw new Error("The model returned an empty message.");
    return content;
}

async function main() {
    const files = listStagedFiles();

    if (files.length === 0) {
        console.error("Nothing staged. Run git add first.");
        process.exit(1);
    }

    const model = createModel(getApiKey());
    const notes: string[] = [];

    console.log("got api key");

    for (const file of files) {
        console.log("writing note for", file.path, "...");
        const { diff } = getFileDiff({ path: file.path, oldPath: file.oldPath });
        const note = await chat({ model, system: NOTE_PROMPT, prompt: diff });
        notes.push(`${file.path}: ${note}`);
        console.log("  ->", note);
    }

    const raw = await chat({ model, system: COMMIT_PROMPT, prompt: notes.join("\n") });
    const message = raw.split("\n")[0].trim().replace(/\.$/, "");
    console.log(message);
    console.log();
    const answer = await ask("Use this message? (y/n/e) ");

    if (answer === "y") commit(message, false);
    else if (answer === "e") commit(message, true);
    else console.log("Cancelled. Your changes are still staged.");
}

main().catch(console.error);
