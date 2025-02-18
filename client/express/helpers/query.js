import fetchBaseQuery, { encodeBody, accessToken, jsonReply } from 'fetchbasequery'

export default fetchBaseQuery({
    logErrors: true,
    middlewares: [
        encodeBody(),
        accessToken({
            getAccessToken: (payload) => payload
        }),
        jsonReply()
    ]
})
