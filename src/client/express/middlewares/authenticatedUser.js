import query from '../helpers/query.js'

const buildFn = (options) => async ({ accessToken, query }) => await query({
    ...options,
    payload: accessToken
})

export default (options = {}) => {
    const { selector, ...fnOptions } = {
        selector: x => x,
        ...(options?.plugins?.authenticatedUser || {})
    }
    let getAuthenticatedUser
    if (!fnOptions) {
        getAuthenticatedUser = () => {}
    } else if (fnOptions instanceof Function) {
        getAuthenticatedUser = fnOptions
    } else if (typeof fnOptions === 'string') {
        getAuthenticatedUser = buildFn({ url: fnOptions })
    } else {
        getAuthenticatedUser = buildFn(fnOptions)
    }
    return async (request, response, next) => {
        const { accessToken } = (request.oauth2 || {})
        const { status, data, error } = accessToken
            ? await getAuthenticatedUser({
                request,
                response,
                query,
                accessToken
              })
            : { status: 401 }
        if (status === 0) {
            response.status(503)
                .json({ error: true, message: 'Authentication server is not available.' }).end()
        } else if (error) {
            response.status(500)
                .json({ error: true, message: error.message }).end()
        } else if (status === 200) {
            request.oauth2.authenticatedUser = selector(data)
            next()
        } else {
            response.status(401)
                .json({ error: true, message: 'Authentication required.' }).end()
        }
    }
}
