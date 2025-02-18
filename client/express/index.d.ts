import type { OAUth2ClientOptions } from '../../index.d.ts';

declare module 'oauth2kit/client/express' {

    export type ExpressAsyncController = (request: any, response: any) => Promise<void>;
    export type ExpressAsyncMiddleware = (request: any, response: any, next: any) => Promise<void>;

    export type ExpressOAuth2Client = {
        controllers: {
            login: ExpressAsyncController,
            logout: ExpressAsyncController,
            obtainToken: ExpressAsyncController
        },
        middlewares: {
            refreshToken: ExpressAsyncMiddleware,
            authenticatedUser: ExpressAsyncMiddleware
        }
    };

    export declare function expressOAuth2Client(options: OAUth2ClientOptions | undefined): ExpressOAuth2Client;

    export = expressOAuth2Client;
};
