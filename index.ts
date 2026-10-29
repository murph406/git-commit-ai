import { execFileSync } from "node:child_process";
import { generateText, stepCountIs } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { SYSTEM_PROMPT } from "./src/prompts";
import { getFileDiff } from "./src/tools";

async function execAgent() {
    const apiKey = execFileSync(
        "security",
        ["find-generic-password", "-s", "ollama-proxy", "-w"],
        { encoding: "utf8" },
    ).trim();

    const ollama = createOpenAICompatible({
        name: "ollama",
        baseURL: "https://macmini.tailec0045.ts.net/v1",
        headers: { "x-api-key": apiKey },
    });

    const result = await generateText({
        model: ollama("qwen2.5-coder:14b"),
        system: SYSTEM_PROMPT,
        prompt: "Write a commit message for the staged changes.",
        stopWhen: stepCountIs(5),
        onStepFinish: (step) => {
            console.log("tool calls:", step.toolCalls);
            console.log("tool results:", step.toolResults);
            console.log("text:", step.text);
        },
        tools: { getFileDiff },
    });

    console.log(result.text);
}

execAgent().catch(console.error);
