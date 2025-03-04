import fetchBaseQuery, { accessToken as accessTokenMiddleware } from 'fetchbasequery'

const serviceWorkerOAuth2Client = (options = {}) => {
    const {
        prepareAuthorizationHeaders
    } = options
    const {
        matcher,
        isSignOut,
        fallback,
        ...defaultQueryOptions
    } = {
        matcher: request => true,
        isSignOut: request => false,
        fallback: fetch,
        ...(options.fetch || {})
    }
    const {
        refreshRate,
        endpoint,
        isExpectedStatus,
        extractAccessToken,
        extractPayload,
        isPayloadChanged
    } = {
        refreshRate: 60, // in seconds
        endpoint: location.origin + '/oauth2/token',
        isExpectedStatus: status => status === 200 || status === 401,
        extractAccessToken: async (response) => {
            const { access_token } = await (response.clone()).json()
            return access_token
        },
        extractPayload: async (response, accessToken) => undefined,
        isPayloadChanged: (previous, next) => true,
        ...(options.refreshToken || {})
    }
    let isPending
    let isUndefined = true
    let accessToken
    let payload
    const getState = () => ({
        isUndefined,
        accessToken,
        payload
    })
    const subscribers = []
    const subscribe = (handler) => {
        subscribers.push(handler)
        return () => {
            const i = subscribers.indexOf(handler)
            if (i >= 0)
                subscribers.splice(i, 1)
        }
    }
    const dispatch = async () => {
        const handlers = subscribers.slice()
        for (let i = 0; i < handlers.length; i ++)
            await handlers[i]()
    }
    const query = fetchBaseQuery({
        logErrors: true,
        credentials: 'include',
        cache: 'reload',
        mode: 'cors',
        middlewares: [
            accessTokenMiddleware({
                getAccessToken: (payload) => accessToken,
                ...(prepareAuthorizationHeaders ? { getAuthorizationHeaders: prepareAuthorizationHeaders } : {})
            })
        ],
        ...defaultQueryOptions
    })
    const queryRefresh = fetchBaseQuery({
        logErrors: true,
        credentials: 'include',
        cache: 'reload',
        middlewares: [
            accessTokenMiddleware({
                getAccessToken: () => accessToken,
                setAccessToken: (token) => { accessToken = token },
                removeAccessToken: () => { accessToken = undefined },
                getUpdatedAccessToken: extractAccessToken,
                ...(prepareAuthorizationHeaders ? { getAuthorizationHeaders: prepareAuthorizationHeaders } : {})
            })
        ]
    })
    const refresh = async () => {
        if (isPending) {
            return
        }
        isPending = true
        const previousAccessToken = accessToken
        const previousPayload = payload
        const response = await queryRefresh({ url: endpoint })
        if (isExpectedStatus(response.status)) {
            payload = accessToken
                ? await extractPayload(response, { query, accessToken })
                : undefined
            isUndefined = false
            if (!accessToken) { // user is not authorized
                refreshing = false
                payload = undefined
            }
            if (false
                || (!previousAccessToken && accessToken)
                || (previousAccessToken && !accessToken)
                || (previousPayload === undefined && payload !== undefined)
                || (previousPayload !== undefined && payload === undefined)
                || (previousPayload && payload && isPayloadChanged(previousPayload, payload))
            ) {
                await dispatch()
            }
        }
        isPending = false
    }
    let timer
    let refreshing
    const tick = () => {
        if (refreshing) {
            refresh().then(() => {
                if (refreshing)
                    timer = setTimeout(tick, refreshRate * 1000)
            })
        }
    }
    const start = () => {
        clearTimeout(timer)
        refreshing = true
        tick()
    }
    const stop = () => {
        refreshing = false
        clearTimeout(timer)
    }
    const doFetch = async (request) => {
        const match = matcher(request)
        const response = await (
            match
                ? query({ request })
                : fallback(request)
        )
        if (match && isSignOut(request)) {
            refresh()
        }
        return response
    }
    return {
        getState,
        refresher: {
            subscribe,
            start,
            stop,
            refresh
        },
        listeners: {
            install: evt => evt.waitUntil(skipWaiting()),
            activate: evt => evt.waitUntil(clients.claim()),
            fetch: evt => {
                const { request } = evt
                return evt.respondWith(doFetch(request))
            }
        }
    }
}

export default serviceWorkerOAuth2Client
