import isFunction from '../../../shared/helpers/isFunction.js'
import isString from '../../../shared/helpers/isString.js'
import query from '../helpers/query.js'
import extractAccessToken from '../helpers/extractAccessToken.js'
import cookiesPlugin from '../plugins/cookies.js'
import useQuery from '../helpers/useQuery.js'

export default (options = {}) => {

    const cookies = cookiesPlugin(options)

    const x = options?.plugins?.signOut
    let signOut
    if (!x) {
        signOut = () => ({ status: 200 })
    } else if (isFunction(x)) {
        signOut = x
    } else if (isString(x)) {
        signOut = useQuery({ url: x })
    } else {
        signOut = useQuery(x)
    }

    return async (request, response) => {
        const accessToken = request.oauth2
            ? request.oauth2.accessToken
            : extractAccessToken(request)
        if (accessToken) {
            await signOut({
                request,
                response,
                query,
                accessToken
            })
        }
        cookies.removeToken(response)
        response.status(204).end()
    }
}
