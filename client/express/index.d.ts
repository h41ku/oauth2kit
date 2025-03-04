import type { OAuth2ClientOptions } from '../../index.d.ts';

declare module 'oauth2kit/client/express' {

    export type ExpressAsyncController = (request: any, response: any) => Promise<void>;
    export type ExpressAsyncMiddleware = (request: any, response: any, next: any) => Promise<void>;

    export type ExpressOAuth2Client = {
        controllers: {
            signIn: ExpressAsyncController,
            signOut: ExpressAsyncController,
            obtainToken: ExpressAsyncController
        },
        middlewares: {
            refreshToken: ExpressAsyncMiddleware,
            authenticatedUser: ExpressAsyncMiddleware
        }
    };

    export declare function expressOAuth2Client(options: OAuth2ClientOptions | undefined): ExpressOAuth2Client;

    export = expressOAuth2Client;
};
