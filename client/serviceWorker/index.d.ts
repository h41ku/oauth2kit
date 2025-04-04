declare module 'oauth2kit/client/serviceWorker' {

    export type EventHandler = (evt: Event) => boolean | undefined;

    export type ClientState = {
        isUndefined: boolean,
        accessToken?: string,
        payload?: any
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
        matcher?: Matcher,
        isSignIn?: Matcher,
        isSignOut?: Matcher,
        fallback?: Fetcher
    };

    export type StatusMatcher = (status: number) => boolean;
    export type AccessTokenExtractor = (request: Request) => Promise<string>;
    export type RefreshRateExtractor = (request: Request) => Promise<number>;
    export type PayloadExtractor = (request: Request) => Promise<any | undefined>;
    export type PayloadChangeDetector = (previous: any, next: any) => boolean;

    export type ServiceWorkerRefreshTokenOptions = {
        endpoint?: string,
        isExpectedStatus?: StatusMatcher,
        extractAccessToken?: AccessTokenExtractor,
        extractRefreshRate?: RefreshRateExtractor,
        extractPayload?: PayloadExtractor,
        isPayloadChanged?: PayloadChangeDetector
    };

    export type ServiceWorkerOAuth2ClientOptions = {
        refreshToken?: ServiceWorkerRefreshTokenOptions,
        fetch?: ServiceWorkerFetchOptions,
    };

    export declare function serviceWorkerOAuth2Client(options?: ServiceWorkerOAuth2ClientOptions): ServiceWorkerOAuth2Client;

    export = serviceWorkerOAuth2Client;
};
