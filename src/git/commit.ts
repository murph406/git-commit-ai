import { execFileSync } from "node:child_process";

export function commit(message: string, edit: boolean): void {
    const args = edit
        ? ["commit", "-v", "-e", "-m", message]
        : ["commit", "-m", message];

    execFileSync("git", args, { stdio: "inherit" });
}