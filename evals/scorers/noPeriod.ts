import { Args } from './types'

const noPeriod = ({ output }: Args) => {
    const name = 'length'
    const result = !output.message.endsWith('.')
    const flag = result === true

    return flag
        ? { name, score: 1 }
        : { name, score: 0, metadata: { why: result } }
}


export default noPeriod