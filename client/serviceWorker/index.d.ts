declare module 'oauth2kit/client/serviceWorker' {

    export type EventHandler = (evt: Event) => boolean | undefined;

    export type ClientState = {
        isUndefined: boolean,
        accessToken: string | undefined,
        payload: any | undefined
    };

    export type StateChangeCallback = () => Promise<void>;
    export type Unsubscribe = () => void;

    export type StateRefresher = {
        subscribe: (handler: StateChangeCallback) => Unsubscribe,
        refresh: () => Promise<void>,
        start: () => void,
        stop: () => void
    };

    export type ServiceWorkerOAuth2Client = {
        getState: () => ClientState,
        refresher: StateRefresher,
        listeners: {
            install: EventHandler,
            activate: EventHandler,
            fetch: EventHandler
        }
    };

    export type Matcher = (request: Request) => boolean;
    export type Fetcher = (request: Request) => Promise<Response>;

    export type ServiceWorkerFetchOptions = {
        matcher: Matcher | undefined,
        isSignOut: Matcher | undefined,
        fallback: Fetcher | undefined
    };

    export type StatusMatcher = (status: number) => boolean;
    export type AccessTokenExtractor = (request: Request) => Promise<string>;
    export type PayloadExtractor = (request: Request) => Promise<any | undefined>;
    export type PayloadChangeDetector = (previous: any, next: any) => boolean;

    export type ServiceWorkerRefreshTokenOptions = {
        refreshRate: number | undefined,
        endpoint: string | undefined,
        isExpectedStatus: StatusMatcher | undefined,
        extractAccessToken: AccessTokenExtractor | undefined,
        extractPayload: PayloadExtractor | undefined,
        isPayloadChanged: PayloadChangeDetector | undefined
    };

    export type ServiceWorkerOAuth2ClientOptions = {
        refreshToken: ServiceWorkerRefreshTokenOptions | undefined,
        fetch: ServiceWorkerFetchOptions | undefined,
    };

    export declare function serviceWorkerOAuth2Client(options: ServiceWorkerOAuth2ClientOptions | undefined): ServiceWorkerOAuth2Client;

    export = serviceWorkerOAuth2Client;
};
