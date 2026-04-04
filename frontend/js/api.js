/* ============================================
   API — fetch wrapper with auth
   ============================================ */

const API = {
    baseUrl: '/api',

    /**
     * Get stored JWT token
     */
    getToken() {
        return localStorage.getItem('ai_review_hub_token');
    },

    /**
     * Set JWT token
     */
    setToken(token) {
        localStorage.setItem('ai_review_hub_token', token);
    },

    /**
     * Remove JWT token
     */
    removeToken() {
        localStorage.removeItem('ai_review_hub_token');
    },

    /**
     * Get stored user data
     */
    getUser() {
        const data = localStorage.getItem('ai_review_hub_user');
        return data ? JSON.parse(data) : null;
    },

    /**
     * Set user data
     */
    setUser(user) {
        localStorage.setItem('ai_review_hub_user', JSON.stringify(user));
    },

    /**
     * Remove user data
     */
    removeUser() {
        localStorage.removeItem('ai_review_hub_user');
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Logout
     */
    logout() {
        this.removeToken();
        this.removeUser();
    },

    /**
     * Core fetch wrapper
     */
    async request(endpoint, options = {}) {
        const url = this.baseUrl + endpoint;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.detail || 'Произошла ошибка';
                throw new Error(errorMsg);
            }

            return data;
        } catch (error) {
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                throw new Error('Не удалось подключиться к серверу');
            }
            throw error;
        }
    },

    // === Auth endpoints ===

    async register(data) {
        const result = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.setToken(result.access_token);
        this.setUser(result.user);
        return result;
    },

    async login(email, password) {
        const result = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        this.setToken(result.access_token);
        this.setUser(result.user);
        return result;
    },

    async getMe() {
        return await this.request('/auth/me');
    },

    // === Models endpoints ===

    async getModels(sort = 'rating', search = '') {
        let endpoint = `/models?sort=${sort}`;
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;
        return await this.request(endpoint);
    },

    async getModel(id) {
        return await this.request(`/models/${id}`);
    },

    // === Reviews endpoints ===

    async getReviews(modelId, page = 1, limit = 10) {
        return await this.request(`/models/${modelId}/reviews?page=${page}&limit=${limit}`);
    },

    async postReview(modelId, data) {
        return await this.request(`/models/${modelId}/reviews`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async voteReview(reviewId, vote) {
        return await this.request(`/reviews/${reviewId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote }),
        });
    },

    // === Local Models endpoints ===

    async getLocalModels(sort = 'rating', search = '') {
        let endpoint = `/local-models?sort=${sort}`;
        if (search) endpoint += `&search=${encodeURIComponent(search)}`;
        return await this.request(endpoint);
    },

    async getLocalModel(id) {
        return await this.request(`/local-models/${id}`);
    },

    async getLocalReviews(modelId, page = 1, limit = 10) {
        return await this.request(`/local-models/${modelId}/reviews?page=${page}&limit=${limit}`);
    },

    async postLocalReview(modelId, data) {
        return await this.request(`/local-models/${modelId}/reviews`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async voteLocalReview(reviewId, vote) {
        return await this.request(`/local-reviews/${reviewId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ vote }),
        });
    },

    // === Users endpoints ===

    async getUserProfile(userId) {
        return await this.request(`/users/${userId}`);
    },
};
