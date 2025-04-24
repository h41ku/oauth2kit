export const defaultOptions = { httpOnly: true, sameSite: 'strict' }

const setCookie = (response, key, value, cookieOptions) => response.cookie(key, value, cookieOptions)
const clearCookie = (response, key, cookieOptions) => response.clearCookie(key, cookieOptions)

export const getCookies = (request, keys, options = {}) => {
    const { prefix } = { ...defaultOptions, ...options }
    return keys.reduce((kv, originalKey) => {
        const key = prefix === undefined ? originalKey : `${prefix}${originalKey}`
        kv[originalKey] = request.cookies[key]
        return kv
    }, {})
}

export const setCookies = (response, kv, options = {}) => {
    const { prefix, ...cookieOptions } = { ...defaultOptions, ...options }
    Object.keys(kv).map(originalKey => {
        const value = kv[originalKey]
        const key = prefix === undefined ? originalKey : `${prefix}${originalKey}`
        if (value === undefined || value === null) {
            clearCookie(response, key, cookieOptions)
        } else {
            setCookie(response, key, value, cookieOptions)
        }
    })
}

export const clearCookies = (response, keys, options = {}) => {
    const { prefix, ...cookieOptions } = { ...defaultOptions, ...options }
    keys.forEach(originalKey => {
        const key = prefix === undefined ? originalKey : `${prefix}${originalKey}`
        clearCookie(response, key, cookieOptions)
    })
}
