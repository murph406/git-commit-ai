import { execFileSync } from "node:child_process";

const MAX_CHARS = 20_000;

const execute = ({ path }: { path: string }) => {
    const diff = execFileSync("git", ["diff", "--staged", "--", path], {
        encoding: "utf8",
    });

    if (diff === "") return { path, diff: "", note: "No staged changes for this file" };
    if (diff.length > MAX_CHARS) return { path, diff: diff.slice(0, MAX_CHARS), note: "Diff truncated" };
    return { path, diff };
}

export default execute