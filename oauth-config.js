// =====================================================
// Trident Studios — OAuth Configuration
// =====================================================
//
// DISCORD SETUP:
//   1. Go to https://discord.com/developers/applications
//   2. Create a new application (or use existing)
//   3. Go to OAuth2 tab → Redirects
//   4. Add your redirect URL, e.g.:
//        http://127.0.0.1:8000/login.html    (local dev)
//        https://yourdomain.com/login.html   (production)
//   5. Copy your Client ID below
//
// GOOGLE SETUP:
//   1. Go to https://console.cloud.google.com/apis/credentials
//   2. Create OAuth 2.0 Client ID → Web application
//   3. Add Authorized JavaScript origins:
//        http://127.0.0.1:8000
//        https://yourdomain.com
//   4. Copy your Client ID below
//
// =====================================================

const OAUTH_CONFIG = {
    discord: {
        // ← Paste your Discord Application Client ID here
        clientId: 'YOUR_DISCORD_CLIENT_ID',

        get redirectUri() {
            return window.location.origin + '/login.html';
        },

        scope: 'identify email',

        // Discord implicit (token) flow — no backend required
        get authUrl() {
            return `https://discord.com/oauth2/authorize` +
                `?client_id=${this.clientId}` +
                `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
                `&response_type=token` +
                `&scope=${encodeURIComponent(this.scope)}`;
        },

        // Called after redirect comes back with token in URL hash
        async fetchUser(accessToken) {
            const res = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!res.ok) throw new Error('Discord API error');
            const data = await res.json();
            return {
                oauthId:   data.id,
                username:  data.username,
                email:     data.email || '',
                avatarUrl: data.avatar
                    ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`
                    : `https://cdn.discordapp.com/embed/avatars/0.png`,
                provider:  'discord'
            };
        }
    },

    google: {
        // ← Paste your Google OAuth Client ID here
        clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    }
};

// =====================================================
// DO NOT EDIT BELOW THIS LINE
// =====================================================

// Parse OAuth token from URL hash after redirect
function parseOAuthHash() {
    const hash = window.location.hash.substring(1);
    if (!hash) return null;
    const params = {};
    hash.split('&').forEach(part => {
        const [key, val] = part.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });
    return params.access_token ? params : null;
}
