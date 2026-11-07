import { Args } from './types'

const capitalized = ({ output }: Args) => {
    const name = 'length'
    const result = /^[A-Z]/.test(output.message)
    const flag = result === true

    return flag
        ? { name, score: 1 }
        : { name, score: 0, metadata: { why: result } }
}


export default capitalized