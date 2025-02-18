export default (options = {}) => async (request, response) => {
    const {
        clientId: client_id,
        redirectUri: redirect_uri,
        scope
    } = (options?.credentials || {})
    const {
        prepareState
    } = {
        prepareState: async () => Date.now(),
        ...(options?.plugins?.login || {})
    }
    const { authorize } = (options?.endpoints || {})
    const state = await prepareState()
    const url = `${authorize}?${new URLSearchParams({ response_type: 'code', client_id, redirect_uri, scope, state })}`
    response.status(302)
    response.set({ Location: url })
    response.end()
}
