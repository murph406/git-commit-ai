import { z } from "zod";
import { tool } from "ai";
import execute from './execute'

const description = "Get the staged diff for one file. Use a path returned by list_staged_files."
const inputSchema = z.object({
    path: z.string().describe("File path relative to the repo root")
})

export default tool({
    description,
    inputSchema,
    execute
})

