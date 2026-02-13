const Auth = {
    async hash(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async login(username, password) {
        const usernameHash = await this.hash(username);
        const passwordHash = await this.hash(password);

        if (usernameHash === AUTH_CONFIG.usernameHash && passwordHash === AUTH_CONFIG.passwordHash) {
            sessionStorage.setItem('authenticated', 'true');
            return true;
        }
        return false;
    },

    isAuthenticated() {
        return sessionStorage.getItem('authenticated') === 'true';
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
        }
    },

    logout() {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
};
