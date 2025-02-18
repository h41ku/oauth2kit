const cookieOptions = { httpOnly: true, sameSite: 'strict' }
const clearCookie = (response, key) => response.clearCookie(key, cookieOptions)
export const clearCookies = (response, keys) => keys.forEach(key => clearCookie(response, key))
const setCookie = (response, key, value) => response.cookie(key, value, cookieOptions)
export const setCookies = (response, kv) => Object.keys(kv).map(key => {
    const value = kv[key]
    if (value === undefined || value === null) {
        clearCookie(response, key)
    } else {
        setCookie(response, key, value)
    }
})
