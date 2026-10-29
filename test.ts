import { execFileSync } from "node:child_process";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

async function main() {
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
    prompt: "Say something fun!",
  });

  console.log(result.text);
}

main().catch(console.error);