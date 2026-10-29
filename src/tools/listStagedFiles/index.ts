import { execFileSync } from "node:child_process";

export type StagedFile = {
  path: string;
  status: string;
  oldPath?: string;
};

const STATUS: Record<string, string> = {
  A: "added",
  M: "modified",
  D: "deleted",
  R: "renamed",
  C: "copied",
};

const listStagedFiles = (): StagedFile[] => {
  const output = execFileSync("git", ["diff", "--staged", "--name-status"], {
    encoding: "utf8",
  });

  return output
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [code, first, second] = line.split("\t");
      const status = STATUS[code[0]] ?? "changed";

      return second
        ? { path: second, oldPath: first, status }
        : { path: first, status };
    });
};

export default listStagedFiles;