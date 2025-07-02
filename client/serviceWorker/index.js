import fetchBaseQuery, { accessToken as accessTokenMiddleware } from 'fetchbasequery'

const INITIAL_REFRESH_RATE = 1 // in seconds
const MAX_NUM_RETRIES = 3

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const createRetry = (maxNumRetries, retryDelay, retryCondition) => query => async (target) => {
    let response
    for (let i = 0; i < maxNumRetries; i ++) {
        response = await query({ ...target, request: target.request.clone() })
        if (retryCondition(response)) {
            await sleep(retryDelay(i + 1))
        } else {
            break
        }
    }
    return response
}

const serviceWorkerOAuth2Client = (options = {}) => {
    const {
        prepareAuthorizationHeaders
    } = options
    const {
        matcher,
        isSignIn,
        isSignOut,
        fallback,
        maxNumRetries,
        retryDelay,
        retryCondition,
        ...defaultQueryOptions
    } = {
        matcher: request => true,
        isSignIn: request => false,
        isSignOut: request => false,
        fallback: fetch,
        maxNumRetries: MAX_NUM_RETRIES,
        retryDelay: i => i * 250,
        retryCondition: response => {
            const { status } = response
            return status === 0 || status === 401 || status === 503
        },
        ...(options.fetch || {})
    }
    const {
        endpoint,
        isExpectedStatus,
        extractAccessToken,
        extractRefreshRate,
        extractPayload,
        isPayloadChanged
    } = {
        endpoint: location.origin + '/oauth2/token',
        isExpectedStatus: status => status === 200 || status === 401,
        extractAccessToken: async (response) => {
            const { access_token } = await (response.clone()).json()
            return access_token
        },
        extractRefreshRate: async (response) => {
            const { expires_in } = await (response.clone()).json()
            const reservedTime = 5
            return Math.max(expires_in - reservedTime, 0)
        },
        extractPayload: async (response, accessToken) => undefined,
        isPayloadChanged: (previous, next) => true,
        ...(options.refreshToken || {})
    }
    const retry = createRetry(maxNumRetries, retryDelay, retryCondition)
    let isPending
    let isUndefined = true
    let accessToken
    let refreshRate = INITIAL_REFRESH_RATE
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
    const queryRefresh = retry(fetchBaseQuery({
        logErrors: true,
        credentials: 'include',
        cache: 'reload',
        middlewares: [
            accessTokenMiddleware({
                getAccessToken: () => accessToken,
                setAccessToken: (token) => { accessToken = token },
                removeAccessToken: () => { accessToken = undefined },
                getUpdatedAccessToken: async (response) => {
                    const accessToken = await extractAccessToken(response)
                    if (accessToken) {
                        refreshRate = await extractRefreshRate(response)
                    }
                    return accessToken
                },
                ...(prepareAuthorizationHeaders ? { getAuthorizationHeaders: prepareAuthorizationHeaders } : {})
            })
        ]
    }))
    const queryUnsafe = retry(fetchBaseQuery({
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
    }))
    const query = async (target) => {
        while (isPending) {
            await sleep(100)
        }
        return await queryUnsafe(target)
    }
    let timer
    let refreshing
    let dispatchRequired
    const refresh = async () => {
        if (isPending) {
            return
        }
        isPending = true
        const previousAccessToken = accessToken
        const previousPayload = payload
        const response = await queryRefresh({ request: new Request(endpoint) })
        if (isExpectedStatus(response.status)) {
            payload = accessToken
                ? await extractPayload(response, { query, accessToken })
                : undefined
            isUndefined = false
            if (!accessToken) { // user is not authorized
                refreshing = false
                payload = undefined
                refreshRate = INITIAL_REFRESH_RATE
            }
            if (false
                || dispatchRequired
                || (!previousAccessToken && accessToken)
                || (previousAccessToken && !accessToken)
                || (previousPayload === undefined && payload !== undefined)
                || (previousPayload !== undefined && payload === undefined)
                || (previousPayload && payload && isPayloadChanged(previousPayload, payload))
            ) {
                dispatchRequired = false
                await dispatch()
            }
        }
        isPending = false
    }
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
        dispatchRequired = true
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
        if (match) {
            if (isSignIn(request)) {
                accessToken = await extractAccessToken(response)
                refreshRate = await extractRefreshRate(response)
                refresh()
            } else if (isSignOut(request)) {
                refresh()
            }
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
