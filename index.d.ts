export type QueryResponse = {
    status: number,
    data: any | undefined,
    error: any | undefined
};

export type QueryFn = (options: any | undefined) => QueryResponse;

export type PluginObtainTokenOptions = {
    error: string | undefined,
    success: string | undefined,
    acceptState: (state: string | undefined) => Promise<boolean>,
    acceptScope: (scope: string | undefined) => Promise<boolean>
};

export type PluginRefreshTokenOptions = {
    reservedTime: number | undefined,
    header: string | undefined,
    condition: ((request: any) => boolean) | undefined;
};

export type PluginAuthenticatedUserOptions = {
    method: string | undefined,
    url: string | undefined,
    expectedStatus: number | undefined,
    selector: (data: any) => any
};

export type PluginSignOutOptions = {
    method: string | undefined,
    url: string | undefined
};

export type PluginSignInOptions = {
    prepareState: () => Promise<string>
};

export type PluginsOptions = {
    signIn: PluginSignInOptions | undefined,
    obtainToken: PluginObtainTokenOptions | undefined,
    refreshToken: PluginRefreshTokenOptions | undefined,
    authenticatedUser: PluginAuthenticatedUserOptions | QueryFn | undefined,
    signOut: PluginSignOutOptions | QueryFn | undefined
};

export type OAuth2ClientOptions = {
    provider: string | undefined,
    credentials: {
        clientId: string,
        clientSecret: string,
        redirectUri: string,
        scope: string
    },
    endpoints: {
        authorize: string,
        getAccessToken: string,
        refreshToken: string
    },
    plugins: PluginsOptions | undefined
};
