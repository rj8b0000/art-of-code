// Test script for the explicit Login request: captures the token into the environment.
pm.test('HTTP 200', () => pm.response.to.have.status(200));

const json    = pm.response.json();
const payload = json && json.data ? json.data : json;
const token   = payload && (payload.token || payload.Token);

pm.test('token present', () => pm.expect(token, 'no token in response').to.be.a('string').and.not.empty);

if (token) {
    pm.environment.set('accessToken', token);

    const exp = payload.tokenExpired || payload.TokenExpired;
    const expiresAtMs = exp ? Number(exp) * 1000 : Date.now() + 60 * 60 * 1000;
    pm.environment.set('tokenExpiresAt', String(expiresAtMs));

    const refresh = payload.refreshToken || payload.RefreshToken;
    if (refresh) pm.environment.set('refreshToken', refresh);

    console.log('[auth] token stored, valid until ' + new Date(expiresAtMs).toISOString());
}
