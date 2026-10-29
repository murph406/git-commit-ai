
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const BASE_URL = "https://macmini.tailec0045.ts.net/v1";
const MODEL = "qwen2.5-coder:14b";

export function createModel(apiKey: string) {
    const ollama = createOpenAICompatible({
        name: "ollama",
        baseURL: BASE_URL,
        headers: { "x-api-key": apiKey },
    })

    return ollama(MODEL);
}