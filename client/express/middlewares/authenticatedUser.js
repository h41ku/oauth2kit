import query from '../helpers/query.js'
import unexpectedProviderError from '../errors/unexpectedProvider.js'

const defaultExpectedStatus = 200

const buildFn = (options) => async ({ accessToken, query }) => await query({
    ...options,
    payload: accessToken
})

export default (options = {}) => {
    const { provider: providerExpected } = options
    const fnOptions = (options?.plugins?.authenticatedUser || {})
    let getAuthenticatedUser
    let responseOptions = {}
    if (!fnOptions) {
        getAuthenticatedUser = () => ({ status: defaultExpectedStatus })
    } else if (fnOptions instanceof Function) {
        getAuthenticatedUser = fnOptions
    } else if (typeof fnOptions === 'string') {
        getAuthenticatedUser = buildFn({ url: fnOptions })
    } else {
        const { selector, expectedStatus, ...queryOptions } = fnOptions
        responseOptions = { selector, expectedStatus }
        getAuthenticatedUser = buildFn(queryOptions)
    }
    const {
        selector,
        expectedStatus
    } = {
        selector: x => x,
        expectedStatus: defaultExpectedStatus,
        ...responseOptions
    }
    return async (request, response, next) => {
        const { provider, accessToken } = (request.oauth2 || {})
        if (provider !== providerExpected) {
            unexpectedProviderError(provider, providerExpected)
        }
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
        } else if (status === expectedStatus) {
            request.oauth2.authenticatedUser = selector(data)
            next()
        } else {
            response.status(401)
                .json({ error: true, message: 'Authentication required.' }).end()
        }
    }
}
