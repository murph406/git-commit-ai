import { ask } from './cli'
import { commit } from './git'
import { createModel, generateMessage, getApiKey } from './llm'
import { getFileDiff, listStagedFiles } from './tools'

async function main() {
    const staged = listStagedFiles()
    const files = staged.map((file) => getFileDiff({ path: file.path, oldPath: file.oldPath }))

    if (files.length === 0) {
        console.error('Nothing staged. Run git add first.')
        process.exit(1)
    }

    const model = createModel(getApiKey())
    const { message } = await generateMessage(model, files)

    console.log(message)
    console.log()
    const answer = await ask('Use this message? (y/n/e) ')

    if (answer === 'y') commit(message, false)
    else if (answer === 'e') commit(message, true)
    else console.log('Cancelled. Your changes are still staged.')
}

main().catch((error: Error) => {
    console.error(error.message)
    process.exit(1)
})
