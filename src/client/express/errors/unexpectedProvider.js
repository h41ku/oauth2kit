export default (provider, providerExpected) => {
    throw new Error(`Unexpected OAuth2 provider "${provider}", expected "${providerExpected}"`)
}
