export default request => {
    const match = (request.headers.authorization || '')
        .match(/^Bearer\s+(\S+)$/i)
    return match ? match[1] : undefined
}
