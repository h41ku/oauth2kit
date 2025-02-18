Using with Express.js
---------------------

First one create a client:

```js
import createOAuth2Client from 'oauth2kit/client/express'

const client = createOAuth2Client({
    provider: 'example', // name of OAuth2 provider
    credentials: { // client credentials
        clientId: '...',
        clientSecret: '...',
        redirectUri: 'https://client.example.org/oauth2/obtainToken',
        scope: 'profile email',
    },
    endpoints: { // endpoints of OAuth2 server
        authorize: 'https://auth.example.org/oauth2/authorize',
        getAccessToken: 'https://auth.example.org/oauth2/token',
        refreshToken: 'https://auth.example.org/oauth2/token'
    },
    plugins: {
        login: {
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
        logout: { // notify OAuth2 server when logging out
            method: 'get',
            url: 'https://auth.example.org/api/v1/users/logout'
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
const { login, obtainToken, logout } = client.controllers
const oauth2Router = new Router()
oauth2Router.get('/obtainToken', throwable(obtainToken))
oauth2Router.get('/login', throwable(login))
oauth2Router.get('/logout', throwable(logout))
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
