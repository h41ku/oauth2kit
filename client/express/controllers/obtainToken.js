import isFunction from '../../../shared/helpers/isFunction.js'
import query from '../helpers/query.js'
import cookiesPlugin from '../plugins/cookies.js'

export default (options = {}) => {

    const { credentials } = options

    const {
        errorUrl,
        successUrl,
        acceptState,
        acceptScope,
        timeout,
        signal
    } = {
        errorUrl: '/',
        successUrl: '/',
        acceptState: async (state) => true,
        acceptScope: async (scope) => true,
        ...(options?.plugins?.obtainToken || {})
    }

    const { obtainToken } = (options?.endpoints || {})

    const cookies = cookiesPlugin(options)

    return async (request, response) => {

        const {
            clientId: client_id,
            clientSecret: client_secret,
            redirectUri: redirect_uri,
        } = (isFunction(credentials) ? credentials(request) : credentials) || {}

        const ErrorPage = ({ error, error_description }) => {
            const url = isFunction(errorUrl) ? errorUrl(request) : errorUrl
            response.status(302)
            response.set({ Location: `${url}?${new URLSearchParams({ error, error_description })}` })
            response.end()
        }

        const { code, scope, state, error: authError } = request.query || {}

        if (authError || !code) {
            return ErrorPage(request.query)
        }

        if (! await acceptState(state)) {
            return ErrorPage({
                error: 'state_error',
                error_description: `Unexpected state (value: ${state}).`
            })
        }

        if (! await acceptScope(scope)) {
            return ErrorPage({
                error: 'scope_error',
                error_description: `Unexpected scope (value: ${scope}).`
            })
        }

        const { status, data, error } = await query({
            url: obtainToken,
            method: 'post',
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id,
                client_secret,
                code,
                redirect_uri
            }),
            timeout,
            signal
        })

        if (error) {
            return ErrorPage({ error: 'response', error_description: error.message })
        } else if (status !== 200) {
            return ErrorPage(data ? data : {
                error: 'unexpected_error',
                error_description: `Unexpected error while obtaining token (status code: ${status}).`
            })
        } else {
            response.status(302)
            const { refresh_token, expires_in } = data
            const expires_at = Math.floor(Date.now() / 1000 + expires_in)
            cookies.putToken(response, refresh_token, expires_at)
            const url = isFunction(successUrl) ? successUrl(request, { scope, state, clientId: client_id, redirectUri: redirect_uri }) : successUrl
            response.set({ Location: url })
        }
        response.end()
    }
}
