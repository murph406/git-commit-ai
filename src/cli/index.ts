import { createInterface } from "node:readline/promises";

export async function ask(question: string): Promise<string> {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(question);

    rl.close();
    return answer.trim().toLowerCase();
}
