export type QueryResponse = {
    status: number,
    data?: any,
    error?: any
};

export type QueryFn = (options?: any) => QueryResponse;

export type SuccessDetails = {
    scope: string,
    state: string,
    clientId: string,
    redirectUri: string
};

export type ErrorUrlFn = (request: object) => string;
export type SuccessUrlFn = (request: object, detail: SuccessDetails) => string;

export type PluginObtainTokenOptions = {
    errorUrl?: string | ErrorUrlFn,
    successUrl?: string | SuccessUrlFn,
    timeout?: number,
    signal?: AbortSignal,
    acceptState: (state?: string) => Promise<boolean>,
    acceptScope: (scope?: string) => Promise<boolean>
};

export type PluginRefreshTokenOptions = {
    reservedTime?: number,
    header?: string,
    timeout?: number,
    signal?: AbortSignal,
    condition?: ((request: any) => boolean);
};

export type PluginAuthenticatedUserOptions = {
    method?: string,
    url?: string,
    timeout?: number,
    signal?: AbortSignal,
    expectedStatus?: number,
    selector?: (data: any) => any
};

export type PluginSignOutOptions = {
    method?: string,
    url?: string,
    timeout?: number,
    signal?: AbortSignal,
};

export type PluginSignInOptions = {
    prepareState: () => Promise<string>
};

export type PluginCookieOptions = {
    prefix?: string,
    domain?: string,
    encode?: (source: string) => string,
    expires?: Date,
    httpOnly?: boolean,
    maxAge?: number,
    path?: string,
    partitioned?: boolean,
    priority?: string,
    secure?: boolean,
    signed?: boolean,
    sameSite?: boolean | string
};

export type PluginsOptions = {
    cookie?: PluginCookieOptions,
    signIn?: PluginSignInOptions,
    obtainToken?: PluginObtainTokenOptions,
    refreshToken?: PluginRefreshTokenOptions,
    authenticatedUser?: PluginAuthenticatedUserOptions | QueryFn,
    signOut?: PluginSignOutOptions | QueryFn
};

export type OAuth2ClientCredentials = {
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    scope: string
};

export type OAuth2ClientCredentialsFn = (request: object) => OAuth2ClientCredentials;

export type OAuth2ClientOptions = {
    credentials: OAuth2ClientCredentials | OAuth2ClientCredentialsFn,
    endpoints: {
        authorize: string,
        obtainToken: string,
        refreshToken: string
    },
    plugins?: PluginsOptions
};
