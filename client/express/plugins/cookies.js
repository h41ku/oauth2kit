import { getCookies, setCookies, clearCookies } from '../helpers/cookies.js'

const serializeToken = ({ refresh_token, expires_at }) => `${expires_at.toString(16)}.${refresh_token}`

const deserializeToken = tokenSerialized => {
    try {
        const m = (tokenSerialized || '').match(/^([a-fA-F0-9]+)\.(.+)$/)
        return !m ? {} : {
            expires_at: parseInt(m[1], 16),
            refresh_token: m[2]
        }
    } catch (error) {
        return {}
    }
}

export default (options = {}) => {

    const cookieOptions = options?.plugins?.cookies
    
    const getToken = (request) => {
        const { token } = getCookies(request, [ 'token' ], cookieOptions)
        return deserializeToken(token)
    }

    const putToken = (response, refresh_token, expires_at) => {
        const token = serializeToken({ refresh_token, expires_at })
        setCookies(response, { token }, cookieOptions)
    }

    const removeToken = (response) => {
        clearCookies(response, [ 'token' ], cookieOptions)
    }

    return {
        getToken,
        putToken,
        removeToken
    }
}