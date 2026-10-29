import { getFileDiff, listStagedFiles } from "./src/tools";
import { COMMIT_PROMPT, NOTE_PROMPT } from "./src/prompts";
import { getApiKey } from "./src/llm/apiKey";
import { createModel } from "./src/llm/model";
import { commit } from "./src/git/commit";
import { chat } from "./src/llm/chat";
import { ask } from "./src/cli";

async function main() {
    const files = listStagedFiles();

    if (files.length === 0) {
        console.error("Nothing staged. Run git add first.");
        process.exit(1);
    }

    const model = createModel(getApiKey());
    const notes: string[] = [];

    for (const file of files) {
        const { diff } = getFileDiff({ path: file.path, oldPath: file.oldPath });
        const note = await chat({ model, system: NOTE_PROMPT, prompt: diff });
        notes.push(`${file.path}: ${note}`);
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

 main().catch((error: Error) => {
    console.error(error.message);
    process.exit(1);
  });
