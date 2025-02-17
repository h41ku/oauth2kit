import query from '../helpers/query.js'
import extractToken from '../helpers/extractToken.js'
import { setCookies, clearCookies } from '../helpers/cookies.js'

const createContext = (request, accessToken) => {
    request.oauth2 = { accessToken }
}

export default (options = {}) => {
    const {
        clientId: client_id,
        clientSecret: client_secret
    } = (options?.credentials || {})
    const { refreshToken } = (options?.endpoints || {})
    const {
        reservedTime,
        header
    } = {
        reservedTime: 5, // in seconds
        header: undefined,
        ...(options?.plugins?.refreshToken)
    }
    return async (request, response, next) => {
        const { refresh_token, expires_at } = request.cookies
        if (!refresh_token) {
            response.status(401).end()
        } else {
            const access_token = extractToken(request)
// console.log('refreshToken()', request.originalUrl, { refresh_token, expires_at, access_token })
// response.status(502).end()
// return;
            if (!access_token || (parseInt(expires_at) - reservedTime) * 1000 <= Date.now()) {
                const { status, data: token } = await query({
                    url: refreshToken,
                    method: 'post',
                    body: new URLSearchParams({
                        grant_type: 'refresh_token',
                        refresh_token,
                        client_id,
                        client_secret
                    })
                })
// console.log('refreshToken()', request.originalUrl, 'new token', { status, token })
                if (status === 0) {
                    response.status(503).end()
                } else if (status === 200) {
                    const { access_token, refresh_token, expires_in } = token
                    const expires_at = Math.floor(Date.now() / 1000 + expires_in)
                    setCookies(response, {
                        refresh_token,
                        expires_at
                    })
                    if (header) {
                        response.set({ [header]: access_token })
                    }
                    createContext(request, access_token)
                    next()
                } else {
                    clearCookies(response, [
                        'refresh_token',
                        'expires_at'
                    ])
                    response.status(401).end()
                }
            } else {
// console.log('refreshToken()', request.originalUrl, 'old token', { access_token })
                createContext(request, access_token)
                next()
            }
        }
    }
}