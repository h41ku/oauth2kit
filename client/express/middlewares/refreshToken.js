import isFunction from '../../../shared/helpers/isFunction.js'
import query from '../helpers/query.js'
import extractAccessToken from '../helpers/extractAccessToken.js'
import cookiesPlugin from '../plugins/cookies.js'

const createContext = (request, accessToken, expiresAt) => {
    request.oauth2 = {
        accessToken,
        expiresAt
    }
}

export default (options = {}) => {

    const { credentials } = options
    const { refreshToken } = (options?.endpoints || {})

    const {
        reservedTime,
        header,
        condition,
        timeout,
        signal
    } = {
        reservedTime: 5, // in seconds
        header: undefined,
        condition: (request) => true,
        ...(options?.plugins?.refreshToken)
    }

    const cookies = cookiesPlugin(options)

    return async (request, response, next) => {

        const {
            clientId: client_id,
            clientSecret: client_secret
        } = (isFunction(credentials) ? credentials(request) : credentials) || {}    

        const { refresh_token, expires_at } = cookies.getToken(request)

        if (!refresh_token) {

            response.status(401).end()

        } else {

            const access_token = extractAccessToken(request)

            if ((!access_token || (expires_at - reservedTime) * 1000 <= Date.now()) && condition(request)) {

                const { status, data: token } = await query({
                    url: refreshToken,
                    method: 'post',
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token,
                        client_id,
                        client_secret
                    }),
                    timeout,
                    signal
                })

                if (status === 0) {

                    response.status(503).end()

                } else if (status === 200) {

                    const { access_token, refresh_token, expires_in } = token
                    const expires_at = Math.floor(Date.now() / 1000 + expires_in)
                    cookies.putToken(response, refresh_token, expires_at)
                    if (header) {
                        response.set({ [header]: access_token })
                    }
                    createContext(request, access_token, expires_at)
                    next()

                } else {

                    cookies.removeToken(response)
                    response.status(401).end()
                }

            } else {

                createContext(request, access_token, expires_at)
                next()
            }
        }
    }
}
