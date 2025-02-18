import query from '../helpers/query.js'
import { setCookies } from '../helpers/cookies.js'

export default (options = {}) => {

    const { provider } = options

    const {
        errorUrl,
        successUrl,
        acceptState,
        acceptScope
    } = {
        errorUrl: '/',
        successUrl: '/',
        acceptState: async (state) => true,
        acceptScope: async (scope) => true,
        ...(options?.plugins?.obtainToken || {})
    }

    const {
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uri,
    } = (options?.credentials || {})

    const { getAccessToken } = (options?.endpoints || {})

    return async (request, response) => {

        const ErrorPage = ({ error, error_description }) => {
            response.status(302)
            response.set({ Location: `${errorUrl}?${new URLSearchParams({ error, error_description })}` })
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
            url: getAccessToken,
            method: 'post',
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id,
                client_secret,
                code,
                redirect_uri
            })
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
            setCookies(response, {
                provider,
                refresh_token,
                expires_at
            })
            response.set({ Location: successUrl })
        }
        response.end()
    }
}
