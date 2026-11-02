// Collection-level assertions applied to every request.
pm.test('HTTP 200', () => pm.response.to.have.status(200));

if (pm.response.code === 401) {
    console.warn('[auth] 401: token rejected. Clear `accessToken` on the environment to force a fresh login.');
}

let json = null;
try { json = pm.response.json(); } catch (e) { /* non-JSON body */ }

// Only asserted when the API wraps responses in a { success, errorMessage, data } envelope.
if (json && Object.prototype.hasOwnProperty.call(json, 'success')) {
    pm.test('envelope.success is true', () => {
        pm.expect(json.success, json.errorMessage || 'errorMessage was null').to.eql(true);
    });
}
