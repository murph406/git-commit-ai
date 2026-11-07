import  { Args } from './types'

const length = ({ output }: Args) => {
    const name = 'length'
    const result = output.message.length <= 72 || `${output.message.length} chars`
    const flag = result === true

    return flag
        ? { name, score: 1 }
        : { name, score: 0, metadata: { why: result } }
}


export default length