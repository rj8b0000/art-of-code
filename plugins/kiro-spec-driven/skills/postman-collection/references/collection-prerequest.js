// Auto-login / token refresh. Collection-level pre-request script.
// Runs before every request. If there is no token, or the stored one expires within
// 2 minutes, it silently calls the login endpoint and stores the new token.
// The login request itself is skipped (no recursion).
// Adjust LOGIN_PATH to the API's real login route.

const LOGIN_PATH = '/api/Auth/login';
const isLoginRequest = String(pm.request.url.toString()).indexOf(LOGIN_PATH) !== -1;

if (!isLoginRequest) {
    const token     = pm.environment.get('accessToken');
    const expiresAt = Number(pm.environment.get('tokenExpiresAt') || 0);
    const skewMs    = 2 * 60 * 1000;
    const stale     = !token || !expiresAt || Date.now() > (expiresAt - skewMs);

    if (stale) {
        const baseUrl  = pm.environment.get('baseUrl');
        const userName = pm.environment.get('userName');
        const password = pm.environment.get('password');

        const missing = [];
        if (!baseUrl)  missing.push('baseUrl');
        if (!userName) missing.push('userName');
        if (!password) missing.push('password');

        if (missing.length) {
            console.warn('[auth] cannot auto-login: set ' + missing.join(', ') + ' on the active environment.');
        } else {
            pm.sendRequest({
                url: baseUrl.replace(/\/+$/, '') + LOGIN_PATH,
                method: 'POST',
                header: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: { mode: 'raw', raw: JSON.stringify({ userName, password }) }
            }, (err, res) => {
                if (err) { console.error('[auth] auto-login failed:', err); return; }
                if (res.code !== 200) { console.error('[auth] auto-login returned HTTP ' + res.code); return; }

                let json;
                try { json = res.json(); }
                catch (e) { console.error('[auth] login response was not JSON'); return; }

                // Tolerates a bare body and a { success, data } envelope.
                const payload  = (json && json.data) ? json.data : json;
                const newToken = payload && (payload.token || payload.Token);
                if (!newToken) { console.error('[auth] no token field in login response'); return; }

                pm.environment.set('accessToken', newToken);

                // tokenExpired is a Unix epoch (seconds) when present; otherwise assume 60 minutes.
                const exp = payload.tokenExpired || payload.TokenExpired;
                const expiresAtMs = exp ? Number(exp) * 1000 : Date.now() + 60 * 60 * 1000;
                pm.environment.set('tokenExpiresAt', String(expiresAtMs));

                const refresh = payload.refreshToken || payload.RefreshToken;
                if (refresh) pm.environment.set('refreshToken', refresh);

                console.log('[auth] token refreshed, valid until ' + new Date(expiresAtMs).toISOString());
            });
        }
    }
}
