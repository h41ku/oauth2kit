export default (options = {}) => (request, response) => {
    const {
        clientId: client_id,
        redirectUri: redirect_uri,
        scope
    } = (options?.credentials || {})
    const { authorize } = (options?.endpoints || {})
    const state = Date.now() // TODO
    const url = `${authorize}?${new URLSearchParams({ response_type: 'code', client_id, redirect_uri, scope, state })}`
    response.status(302)
    response.set({ Location: url })
    response.end()
}
