import isFunction from '../../../shared/helpers/isFunction.js'
import isString from '../../../shared/helpers/isString.js'
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
    const fnOptions = options?.plugins?.signOut
    let signOut
    if (!fnOptions) {
        signOut = () => ({ status: 200 })
    } else if (isFunction(fnOptions)) {
        signOut = fnOptions
    } else if (isString(fnOptions)) {
        signOut = buildFn({ url: fnOptions })
    } else {
        signOut = buildFn(fnOptions)
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
            await signOut({
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
