import { Args } from './types'

const imperative = ({ output }: Args) => {
    const name = 'length'
    const result = !/(ed|ing)$/.test(output.message.split(' ')[0])
    const flag = result === true

    return flag
        ? { name, score: 1 }
        : { name, score: 0, metadata: { why: result } }
}


export default imperative