import query from '../helpers/query.js'
import { clearCookies } from '../helpers/cookies.js'

const buildFn = (options) => async ({ accessToken, query }) => await query({
    ...options,
    payload: accessToken
})

export default (options = {}) => {
    const fnOptions = options?.plugins?.logout
    let logout
    if (!fnOptions) {
        logout = () => {}
    } else if (fnOptions instanceof Function) {
        logout = fnOptions
    } else if (typeof fnOptions === 'string') {
        logout = buildFn({ url: fnOptions })
    } else {
        logout = buildFn(fnOptions)
    }
    return async (request, response) => {
        const { accessToken } = (request.oauth2 || {})
        if (accessToken) {
            const { status, data, error } = await logout({
                request,
                response,
                query,
                accessToken
            })
// console.log('logout()', { status, data, error })
        }
        clearCookies(response, [ 'refresh_token', 'expires_at' ])
        response.status(204).end()
    }
}
