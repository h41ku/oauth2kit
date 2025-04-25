export default (options = {}) => async ({ accessToken: payload, query }) => await query({ ...options, payload })
