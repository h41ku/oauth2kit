import login from './controllers/login.js'
import logout from './controllers/logout.js'
import obtainToken from './controllers/obtainToken.js'
import refreshToken from './middlewares/refreshToken.js'
import authenticatedUser from './middlewares/authenticatedUser.js'

const createOAuth2Client = (options = {}) => {
    return {
        controllers: {
            login: login(options),
            logout: logout(options),
            obtainToken: obtainToken(options)
        },
        middlewares: {
            refreshToken: refreshToken(options),
            authenticatedUser: authenticatedUser(options),
        }
    }
}

export default createOAuth2Client
