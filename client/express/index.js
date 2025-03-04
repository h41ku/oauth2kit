import signIn from './controllers/signIn.js'
import signOut from './controllers/signOut.js'
import obtainToken from './controllers/obtainToken.js'
import refreshToken from './middlewares/refreshToken.js'
import authenticatedUser from './middlewares/authenticatedUser.js'

const expressOAuth2Client = (options = {}) => {
    return {
        controllers: {
            signIn: signIn(options),
            signOut: signOut(options),
            obtainToken: obtainToken(options)
        },
        middlewares: {
            refreshToken: refreshToken(options),
            authenticatedUser: authenticatedUser(options),
        }
    }
}

export default expressOAuth2Client
