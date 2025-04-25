import isFunction from '../../../shared/helpers/isFunction.js'
import isString from '../../../shared/helpers/isString.js'
import query from '../helpers/query.js'
import useQuery from '../helpers/useQuery.js'

const defaultExpectedStatus = 200

export default (options = {}) => {

    const x = (options?.plugins?.authenticatedUser || {})
    let getAuthenticatedUser
    let responseOptions = {}
    if (!x) {
        getAuthenticatedUser = () => ({ status: defaultExpectedStatus })
    } else if (isFunction(x)) {
        getAuthenticatedUser = x
    } else if (isString(x)) {
        getAuthenticatedUser = useQuery({ url: x })
    } else {
        const { selector, expectedStatus, ...queryOptions } = x
        responseOptions = { selector, expectedStatus }
        getAuthenticatedUser = useQuery(queryOptions)
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
        const { accessToken } = (request.oauth2 || {})
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
