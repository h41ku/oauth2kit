# oauth2kit

## Using with Express.js (backend-side of the client)

First one create a client:

```js
import createOAuth2Client from 'oauth2kit/client/express'

const client = createOAuth2Client({
    credentials: { // client credentials
        clientId: '...',
        clientSecret: '...',
        redirectUri: 'https://client.example.org/oauth2/obtainToken',
        scope: 'profile email',
    },
    endpoints: { // endpoints of OAuth2 server
        authorize: 'https://auth.example.org/oauth2/authorize',
        obtainToken: 'https://auth.example.org/oauth2/token',
        refreshToken: 'https://auth.example.org/oauth2/token'
    },
    plugins: {
        signIn: {
            prepareState: async () => Date.now().toString() // just example
        },
        obtainToken: { // redirect under application
            error: '/',
            success: '/',
            acceptState: async (state) => true,
            acceptScope: async (scope) => true
        },
        refreshToken: {
            reservedTime: 5, // keep some reserved time (in seconds) before token expires
            header: 'X-Access-Token' // add header to response which contains new access token
        },
        authenticatedUser: { // get info about authenticated user
            method: 'get',
            url: 'https://auth.example.org/api/v1/users/me',
            expectedStatus: 200, // expected http status
            selector: ({ user }) => user // select property from json reply
        },
        signOut: { // notify OAuth2 server when logging out
            method: 'get',
            url: 'https://auth.example.org/api/v1/users/signOut'
        }
    }
})
```

Then use the client to extend express application:

```js
import express, { Router } from 'express'
import cookieParser from 'cookie-parser' // or another compatible package
import { throwable, finalize } from 'express-throwable' // optional, but recommended

const app = express()
app.use(cookieParser()) // required by middleware
// omit other middlewares...

// bind client's controllers
const { signIn, obtainToken, signOut } = client.controllers
const oauth2Router = new Router()
oauth2Router.get('/obtainToken', throwable(obtainToken))
oauth2Router.get('/signIn', throwable(signIn))
oauth2Router.get('/signOut', throwable(signOut))
app.use('/oauth2', oauth2Router)

// now lets create restricted area
const { refreshToken, authenticatedUser } = client.middlewares
const apiRouter = new Router() // router for restricted area
apiRouter.use(refreshToken)
apiRouter.get('/users/me', authenticatedUser, throwable((request, response) => {
    response.status(200)
        .json({ success: true, data: request.oauth2.authenticatedUser })
        .end()
}))
app.use('/api', apiRouter) // not authentication is required for this area

// start app
app.use(finalize()) // optional, but recommended
app.listen(3000) // start listening
```

## Using with ServiceWorker (frontend-side of the client)

Here is example of a service worker:

```js
import createOAuth2Client from 'oauth2kit/client/serviceWorker'

const oauth2Client = createOAuth2Client({
    refreshToken: {
        endpoint: '/api/token',
        extractAccessToken: async (response) => {
            const { accessToken } = await (response.clone()).json()
            return accessToken
        },
        extractRefreshRate: async (response) => {
            const { expiresIn } = await (response.clone()).json()
            const reservedTime = 5 // in seconds
            return Math.max(expiresIn - reservedTime, 0)
        },
        extractPayload: async (response, accessToken) => {
            const { authenticatedUser } = await (response.clone()).json()
            return authenticatedUser
        },
        isPayloadChanged: (previous, next) => true // here your need to deep compare object `previous` with object `next`
    },
    fetch: {
        matcher: request => {
            const { origin, pathname } = new URL(request.url)
            return request.method === 'GET'
                && origin === location.origin
                && /^\/(oauth2|api)\//.test(pathname)
        },
        isSignIn: request => {
            const { origin, pathname } = new URL(request.url)
            return request.method === 'GET'
                && origin === location.origin
                && pathname === '/oauth2/signin'
        },
        isSignOut: request => {
            const { origin, pathname } = new URL(request.url)
            return request.method === 'GET'
                && origin === location.origin
                && pathname === '/oauth2/signout'
        }
    }
})

addEventListener('install', oauth2Client.listeners.install)
addEventListener('activate', oauth2Client.listeners.activate)
addEventListener('fetch', oauth2Client.listeners.fetch)

const getState = () => {
    const { isUndefined, accessToken, payload } = oauth2Client.getState()
    return {
        isUndefined,
        ...(isUndefined ? {} : {
            isAuthenticated: !!accessToken,
            payload
        })
    }
}

const createStateMessage = () => ({
    type: 'state',
    state: getState()
})

const sendCurrentStateTo = (client) => client.postMessage(createStateMessage())

oauth2Client.refresher.subscribe(async () => {
    (await clients.matchAll())
        .forEach(sendCurrentStateTo)
})

const checkAuthentication = () => oauth2Client.refresher.start()

addEventListener('message', evt => { // incoming messages from clients
    const { data, source: client } = evt
    const { type } = data
    if (type === 'initClient') { // client notifies about launching itself
        sendCurrentStateTo(client)
        checkAuthentication()
    }
})

checkAuthentication()
```

Example of entrypoint of application:

```js
import getServiceWorker from 'getserviceworker' // easy registration of a service worker
import initializeApplication from './initializeApplication.js' // an abstract function

const launchApp = async () => {
    const serviceWorker = await getServiceWorker('/serviceWorker.js', { // bundled code 
        type: 'module',
        updateViaCache: 'none'
    })
    const serviceWorkerContainer = navigator.serviceWorker
    serviceWorkerContainer.addEventListener('message', evt => { // incoming messages from serviceWorker.js
        const { data } = evt
        if (data.type === 'state') {
            const { isAuthenticated, payload: authenticatedUser } = data.state
            initializeApplication({ isAuthenticated, authenticatedUser }) // initialize application with this state
        }
    })
    serviceWorker.postMessage({ type: 'initClient' }) // notify serviceWorker.js about this client
}

launchApp()
```
