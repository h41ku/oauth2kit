import query from '../helpers/query.js'
import { clearCookies } from '../helpers/cookies.js'
import extractToken from '../helpers/extractToken.js'
import unexpectedProviderError from '../errors/unexpectedProvider.js'

const buildFn = (options) => async ({ accessToken, query }) => await query({
    ...options,
    payload: accessToken
})

export default (options = {}) => {
    const { provider: providerExpected } = options
    const fnOptions = options?.plugins?.logout
    let logout
    if (!fnOptions) {
        logout = () => ({ status: 200 })
    } else if (fnOptions instanceof Function) {
        logout = fnOptions
    } else if (typeof fnOptions === 'string') {
        logout = buildFn({ url: fnOptions })
    } else {
        logout = buildFn(fnOptions)
    }
    return async (request, response) => {
        const accessToken = request.oauth2
            ? request.oauth2.accessToken
            : extractToken(request)
        if (accessToken) {
            const { provider } = request.cookies
            if (provider !== providerExpected) {
                unexpectedProviderError(provider, providerExpected)
            }
            await logout({
                request,
                response,
                query,
                accessToken
            })
        }
        clearCookies(response, [ 'provider', 'refresh_token', 'expires_at' ])
        response.status(204).end()
    }
}
